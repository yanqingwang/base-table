#!/usr/bin/env python3
"""
DocuSign PRD Bulk Export — Incremental, SQLite-backed, GET-only.

Exports completed envelope data from DocuSign production accounts.
All data (metadata, form fields, recipient info) goes into SQLite.
Files (PDFs, attachments) are stored on disk with paths tracked in SQLite.

Incremental: each run only fetches envelopes not yet in the SQLite database.
Safe to run multiple times — PRD is never modified (GET-only).

Usage:
    python docusign_bulk_export.py                           # All accounts, incremental
    python docusign_bulk_export.py --account TE-Malaysia     # Single account
    python docusign_bulk_export.py --template "Offer"        # Filter by template name
    python docusign_bulk_export.py --from 2026-06-01 --to 2026-06-30
    python docusign_bulk_export.py --force                   # Re-fetch even if already exported
    python docusign_bulk_export.py --dry-run                 # Show what would be fetched
    python docusign_bulk_export.py --status                  # Show export stats
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# Path setup
_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR.parent))  # for docusign_lib

from docusign_lib.auth import DocuSignAuth
from docusign_lib.tracking_db import TrackingDb
from docusign_lib.config import get_tracking_db_path, get_exports_dir

EXPORT_DIR = get_exports_dir("prd")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _safe_name(s: str) -> str:
    cleaned = "".join(c for c in (s or "") if c.isalnum() or c in "._- ").strip()
    cleaned = "_".join(cleaned.split())
    return cleaned or "envelope"


def _file_hash(path: Path) -> str:
    """SHA-256 of file content."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _human_time(iso_str: str) -> str:
    if not iso_str:
        return ""
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d %H:%M")
    except Exception:
        return iso_str[:19]


# ---------------------------------------------------------------------------
# Envelope fetching (GET-only)
# ---------------------------------------------------------------------------


def _fetch_envelopes(
    auth: DocuSignAuth,
    from_date: str,
    to_date: str,
    template_filter: str = "",
) -> List[Dict[str, Any]]:
    """Fetch envelopes from DocuSign API. GET-only."""
    params: Dict[str, str] = {
        "from_date": f"{from_date}T00:00:00Z",
        "to_date": f"{to_date}T23:59:59Z",
    }
    print(f"  Fetching envelopes {from_date} → {to_date} ...")
    envelopes = auth.get_paginated("/envelopes", params=params, page_size=100)
    print(f"  Found {len(envelopes)} envelope(s)")

    if template_filter:
        filtered = []
        for env in envelopes:
            env_id = env.get("envelopeId", "")
            try:
                tpl_data = auth.get(f"/envelopes/{env_id}/templates")
                tpl_names = [
                    t.get("name", "") for t in tpl_data.get("templates", [])
                    if template_filter.lower() in t.get("name", "").lower()
                ]
                if tpl_names:
                    env["_template_matched"] = "; ".join(tpl_names)
                    filtered.append(env)
            except Exception:
                continue
        print(f"  Template filter '{template_filter}': {len(filtered)} matched")
        envelopes = filtered

    return envelopes


def _fetch_recipients(auth: DocuSignAuth, env_id: str) -> Dict[str, Any]:
    """Fetch recipients for an envelope. GET-only."""
    try:
        return auth.get(f"/envelopes/{env_id}/recipients")
    except Exception:
        return {}


def _fetch_form_data(auth: DocuSignAuth, env_id: str) -> Dict[str, str]:
    """Extract tab values (form data) from a completed envelope. GET-only."""
    result: Dict[str, str] = {}

    # Method 1: form_data endpoint
    try:
        form_resp = auth.get(f"/envelopes/{env_id}/form_data")
        for entry in form_resp.get("formData", []):
            label = entry.get("name", "")
            value = entry.get("value", "")
            if label:
                result[label] = value
        if result:
            return result
    except Exception:
        pass

    # Method 2: per-recipient tabs
    try:
        recipients_resp = auth.get(f"/envelopes/{env_id}/recipients")
        for recipient_key, recipients_list in recipients_resp.items():
            if not isinstance(recipients_list, list):
                continue
            for recipient in recipients_list:
                rid = str(recipient.get("recipientId", ""))
                if not rid:
                    continue
                tabs_resp = auth.get(f"/envelopes/{env_id}/recipients/{rid}/tabs")
                for tab_type, tabs_list in tabs_resp.items():
                    if not isinstance(tabs_list, list):
                        continue
                    for tab in tabs_list:
                        label = tab.get("tabLabel", "")
                        value = tab.get("value", "") or tab.get("name", "") or ""
                        if label:
                            result[label] = value
        if result:
            return result
    except Exception:
        pass

    return result


def _download_documents(
    auth: DocuSignAuth,
    env_id: str,
    pdf_dir: Path,
    employee_name: str = "",
) -> List[Dict[str, Any]]:
    """Download combined PDF + individual documents. GET-only."""
    pdf_dir.mkdir(parents=True, exist_ok=True)
    docs = []
    short_id = env_id.replace("-", "")[:8] or env_id[:8]
    prefix = _safe_name(employee_name)

    # Combined PDF
    try:
        raw = auth.get_raw(f"/envelopes/{env_id}/documents/combined")
        pdf_path = pdf_dir / f"{prefix}_{short_id}_combined.pdf"
        if not pdf_path.exists():
            pdf_path.write_bytes(raw)
        docs.append({
            "document_id": "combined",
            "name": "Combined PDF",
            "file_path": str(pdf_path),
            "file_size": len(raw),
            "file_hash": hashlib.sha256(raw).hexdigest(),
            "doc_type": "combined",
        })
    except Exception as exc:
        print(f"    [warn] Combined PDF download failed: {exc}")

    # Individual documents
    try:
        docs_resp = auth.get(f"/envelopes/{env_id}/documents")
        for doc in docs_resp.get("envelopeDocuments", []):
            did = str(doc.get("documentId", ""))
            dname = doc.get("name", f"doc_{did}")
            if not did or did == "combined":
                continue
            try:
                raw = auth.get_raw(f"/envelopes/{env_id}/documents/{did}")
                safe = "".join(c for c in dname if c.isalnum() or c in "._- ").strip()
                safe = safe or f"attachment_{did}"
                if not safe.endswith(".pdf"):
                    safe += ".pdf"
                file_path = pdf_dir / f"{prefix}_{short_id}_{safe}"
                if not file_path.exists():
                    file_path.write_bytes(raw)
                docs.append({
                    "document_id": did,
                    "name": dname,
                    "file_path": str(file_path),
                    "file_size": len(raw),
                    "file_hash": hashlib.sha256(raw).hexdigest(),
                    "doc_type": "attachment",
                })
            except Exception as exc:
                print(f"    [warn] Doc {did} ({dname}) download failed: {exc}")
    except Exception as exc:
        print(f"    [warn] Document list failed: {exc}")

    return docs


# ---------------------------------------------------------------------------
# Main export logic
# ---------------------------------------------------------------------------


def export_envelopes(
    from_date: str = "",
    to_date: str = "",
    account_name: str = "",
    template_filter: str = "",
    force: bool = False,
    dry_run: bool = False,
    no_pdfs: bool = False,
    skip_form_data: bool = False,
) -> Dict[str, Any]:
    """Run incremental export: fetch new envelopes, store in SQLite, download PDFs.

    Args:
        from_date: Start date YYYY-MM-DD (default: 30 days ago).
        to_date: End date YYYY-MM-DD (default: today).
        account_name: Account name to process (default: all accounts).
        template_filter: Only export envelopes matching template name.
        force: Re-fetch even if already exported.
        dry_run: Show what would be done without doing it.
        no_pdfs: Skip PDF download (metadata + form data only).
        skip_form_data: Skip form data extraction.

    Returns:
        Summary dict.
    """
    auth = DocuSignAuth("prd")
    db_path = get_tracking_db_path("prd")
    db = TrackingDb(db_path)
    db.init_schema()

    today = datetime.now(timezone.utc)
    from_date = from_date or (today - timedelta(days=30)).strftime("%Y-%m-%d")
    to_date = to_date or today.strftime("%Y-%m-%d")

    # Resolve accounts
    all_accts = auth.list_accounts()
    if account_name:
        targets = [a for a in all_accts if account_name.lower() in a["name"].lower()]
    else:
        targets = all_accts

    if not targets:
        print("No accounts found.")
        db.close()
        return {"total": 0, "exported": 0, "errors": 0}

    print(f"{'='*60}")
    print(f" PRD Bulk Export — Incremental, GET-only")
    print(f"{'='*60}")
    print(f"  Date: {from_date} → {to_date}")
    print(f"  Accounts: {len(targets)}")
    for a in targets:
        print(f"    - {a['name']} ({a['guid'][:16]}...)")
    print(f"  Force re-fetch: {force}")
    print(f"  Dry run: {dry_run}")
    print()

    total_fetched = 0
    total_exported = 0
    total_errors = 0
    batch_id = db.get_batch_id()

    for acct in targets:
        acct_auth = DocuSignAuth("prd", account_guid=acct["guid"])
        print(f"\n--- Account: {acct['name']} ---")

        # Check existing stats
        stats = db.get_export_stats()
        print(f"  DB: {stats['total_envelopes']} total, {stats['exported']} exported, {stats['pending']} pending")

        # Get export date range from DB if not forced
        if not force:
            # Only fetch envelopes not yet in export_tracking
            unexported = db.get_unexported_envelopes(account_id=acct["guid"])
            if unexported:
                print(f"  {len(unexported)} unexported envelopes in DB — processing those first")
                db_envelopes = unexported
            else:
                db_envelopes = []
                print(f"  No unexported envelopes in DB — checking API for new ones")
        else:
            db_envelopes = []
            print(f"  Force mode: re-fetching all from API")

        # Fetch from API if needed
        api_envelopes = []
        if force or not db_envelopes:
            api_envelopes = _fetch_envelopes(acct_auth, from_date, to_date, template_filter)
            # Filter out already-exported unless forced
            if not force and api_envelopes:
                before = len(api_envelopes)
                api_envelopes = [e for e in api_envelopes if not db.is_exported(e.get("envelopeId", ""))]
                print(f"  Filtered {before} → {len(api_envelopes)} new (already exported skipped)")

        if dry_run:
            total_fetched += len(api_envelopes) + len(db_envelopes)
            print(f"  [DRY RUN] Would process {len(api_envelopes) + len(db_envelopes)} envelope(s)")
            continue

        pdf_dir = EXPORT_DIR / today.strftime("%Y-%m-%d") / "pdfs"

        # Process API envelopes
        for env in api_envelopes:
            env_id = env.get("envelopeId", "")
            if not env_id:
                continue
            total_fetched += 1

            try:
                sender = env.get("sender", {})
                sender_name = sender.get("userName", "") if isinstance(sender, dict) else ""
                sender_email = sender.get("email", "") if isinstance(sender, dict) else ""

                # Fetch recipients
                recipients_data = _fetch_recipients(acct_auth, env_id)
                employee_name = ""
                employee_email = ""
                for r in recipients_data.get("signers", []):
                    if r.get("roleName") == "Employee":
                        employee_name = r.get("name", "")
                        employee_email = r.get("email", "")
                        break
                if not employee_name:
                    employee_name = sender_name

                # Store envelope in SQLite
                env_record = {
                    "envelope_id": env_id,
                    "account_id": acct["guid"],
                    "employee_name": employee_name,
                    "employee_email": employee_email,
                    "template_id": env.get("_template_matched", ""),
                    "template_name": env.get("emailSubject", "")[:80],
                    "status": env.get("status", "unknown"),
                    "email_subject": env.get("emailSubject", ""),
                    "envelope_type": "api",
                    "created_at": env.get("createdDateTime", ""),
                    "raw_recipients_json": json.dumps(recipients_data, ensure_ascii=False),
                }
                db.upsert_envelope(env_record)

                # Extract form data
                form_data: Dict[str, str] = {}
                if not skip_form_data:
                    form_data = _fetch_form_data(acct_auth, env_id)
                    if form_data:
                        db.store_form_data(env_id, form_data)

                # Download PDFs
                docs = []
                if not no_pdfs:
                    docs = _download_documents(acct_auth, env_id, pdf_dir, employee_name)
                    for d in docs:
                        db.record_document(env_id, d["document_id"], d["name"],
                                           d["file_path"], d["file_size"], d["file_hash"], d["doc_type"])

                # Mark exported
                db.mark_exported(
                    env_id, batch_id,
                    pdf_exported=bool(docs),
                    form_data_exported=bool(form_data),
                    attachments_count=len(docs),
                )
                total_exported += 1
                print(f"  ✓ {env_id[:20]}... {employee_name} "
                      f"(form: {len(form_data)} fields, docs: {len(docs)})")

            except Exception as exc:
                total_errors += 1
                print(f"  ✗ {env_id[:20]}... ERROR: {exc}")
                db.upsert_envelope({
                    "envelope_id": env_id,
                    "account_id": acct["guid"],
                    "status": "error",
                    "error_message": str(exc),
                })

        # Process unexported DB envelopes (already in DB but not exported)
        for env in db_envelopes:
            env_id = env["envelope_id"]
            if not force and db.is_exported(env_id):
                continue
            total_fetched += 1

            try:
                # Extract form data from API
                form_data = {}
                if not skip_form_data:
                    form_data = _fetch_form_data(acct_auth, env_id)
                    if form_data:
                        db.store_form_data(env_id, form_data)

                # Download PDFs
                docs = []
                if not no_pdfs:
                    employee_name = env.get("employee_name", "")
                    docs = _download_documents(acct_auth, env_id, pdf_dir, employee_name)
                    for d in docs:
                        db.record_document(env_id, d["document_id"], d["name"],
                                           d["file_path"], d["file_size"], d["file_hash"], d["doc_type"])

                db.mark_exported(
                    env_id, batch_id,
                    pdf_exported=bool(docs),
                    form_data_exported=bool(form_data),
                    attachments_count=len(docs),
                )
                total_exported += 1
                print(f"  ✓ {env_id[:20]}... (from DB pending) "
                      f"(form: {len(form_data)} fields, docs: {len(docs)})")

            except Exception as exc:
                total_errors += 1
                print(f"  ✗ {env_id[:20]}... ERROR: {exc}")

    db.close()

    print(f"\n{'='*60}")
    print(f" EXPORT SUMMARY")
    print(f"{'='*60}")
    print(f"  Fetched:   {total_fetched}")
    print(f"  Exported:  {total_exported}")
    print(f"  Errors:    {total_errors}")
    if total_exported:
        print(f"  Batch:     {batch_id}")
        print(f"  SQLite:    {db_path}")
    print(f"  Read-only: ✓ (no PRD changes made)")

    return {
        "fetched": total_fetched,
        "exported": total_exported,
        "errors": total_errors,
        "batch_id": batch_id,
        "dry_run": dry_run,
    }


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


def show_stats():
    """Display export statistics without fetching."""
    db = TrackingDb(get_tracking_db_path("prd"))
    db.init_schema()
    stats = db.get_export_stats()
    print(f"\nExport Statistics (PRD):")
    print(f"  Total envelopes: {stats['total_envelopes']}")
    print(f"  Exported:        {stats['exported']}")
    print(f"  Pending:         {stats['pending']}")

    # List batches
    rows = db.conn.execute(
        "SELECT export_batch, COUNT(*) as cnt, MIN(exported_at) as first, MAX(exported_at) as last "
        "FROM export_tracking GROUP BY export_batch ORDER BY first DESC LIMIT 10"
    ).fetchall()
    if rows:
        print(f"\n  Recent batches:")
        for r in rows:
            print(f"    {r['export_batch']}: {r['cnt']} envelopes ({_human_time(r['first'])} - {_human_time(r['last'])})")
    db.close()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(
        description="DocuSign PRD Bulk Export — Incremental, SQLite-backed, GET-only",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--account", default="", help="Account name to process (default: all)")
    parser.add_argument("--template", default="", help="Filter by template name (partial match)")
    parser.add_argument("--from", dest="from_date", default="", help="Start date YYYY-MM-DD")
    parser.add_argument("--to", default="", help="End date YYYY-MM-DD (default: today)")
    parser.add_argument("--force", action="store_true", help="Re-fetch already exported envelopes")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done")
    parser.add_argument("--no-pdfs", action="store_true", help="Skip PDF download")
    parser.add_argument("--skip-form-data", action="store_true", help="Skip form data extraction")
    parser.add_argument("--status", action="store_true", help="Show export stats and exit")

    args = parser.parse_args()

    if args.status:
        show_stats()
        return

    try:
        result = export_envelopes(
            from_date=args.from_date,
            to_date=args.to,
            account_name=args.account,
            template_filter=args.template,
            force=args.force,
            dry_run=args.dry_run,
            no_pdfs=args.no_pdfs,
            skip_form_data=args.skip_form_data,
        )
        sys.exit(1 if result["errors"] else 0)
    except Exception as exc:
        print(f"\nFATAL: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
