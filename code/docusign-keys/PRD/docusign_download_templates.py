#!/usr/bin/env python3
"""
DocuSign PRD Template Download — Incremental, GET-only.

Downloads template definitions and documents from PRD (production) accounts
to local templates/ directory. All data (metadata, recipients, tabs) goes
into SQLite tracking. Document PDFs are stored on disk.

Incremental: each run only downloads templates not yet in the local DB.
Safe to run multiple times — PRD is never modified (GET-only).

Usage:
    python docusign_download_templates.py                    # All accounts, incremental
    python docusign_download_templates.py --account TE-Malaysia
    python docusign_download_templates.py --force            # Re-download all
    python docusign_download_templates.py --dry-run          # Show what would be done
    python docusign_download_templates.py --status           # Show download stats
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR.parent))

from docusign_lib.auth import DocuSignAuth
from docusign_lib.tracking_db import TrackingDb
from docusign_lib.config import get_tracking_db_path, get_templates_dir

TEMPLATES_DIR = get_templates_dir("prd")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _safe_name(s: str) -> str:
    cleaned = "".join(c for c in (s or "") if c.isalnum() or c in "._- ").strip()
    cleaned = "_".join(cleaned.split())
    return cleaned or "template"


def _human_time(iso_str: str) -> str:
    if not iso_str:
        return ""
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d %H:%M")
    except Exception:
        return iso_str[:19]


# ---------------------------------------------------------------------------
# Template downloading (GET-only)
# ---------------------------------------------------------------------------


def _list_templates(auth: DocuSignAuth, search: str = "") -> List[Dict[str, Any]]:
    """List all templates via API. GET-only."""
    params: Dict[str, str] = {}
    if search:
        params["search_text"] = search
    return auth.get_paginated("/templates", params=params, result_key="envelopeTemplates", page_size=50)


def _download_template_definition(
    auth: DocuSignAuth,
    template_id: str,
    template_dir: Path,
    template_name: str,
) -> Dict[str, Any]:
    """Download full template definition (metadata + recipients + tabs). GET-only.

    Returns the template definition dict.
    """
    path = f"/templates/{template_id}"
    # Include all fields for a complete definition
    try:
        definition = auth.get(
            path,
            {"include": "documents,recipients,tabs,notifications,custom_fields,folders"},
        )
    except Exception as exc:
        print(f"    [warn] Template definition failed: {exc}")
        return {}

    # Save JSON definition
    safe = _safe_name(template_name)
    json_path = template_dir / f"{safe}_{template_id[:8]}_definition.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(definition, f, indent=2, ensure_ascii=False, default=str)
    print(f"    ✓ Definition saved ({json_path.name})")
    return definition


def _download_template_documents(
    auth: DocuSignAuth,
    template_id: str,
    template_dir: Path,
    template_name: str,
) -> List[Dict[str, Any]]:
    """Download all documents for a template. GET-only.

    Returns list of document info dicts with local paths.
    """
    docs_dir = template_dir / "documents"
    docs_dir.mkdir(parents=True, exist_ok=True)
    docs: List[Dict[str, Any]] = []

    try:
        docs_resp = auth.get(f"/templates/{template_id}/documents")
        for doc in docs_resp.get("templateDocuments", []):
            did = str(doc.get("documentId", ""))
            dname = doc.get("name", f"doc_{did}")
            if not did:
                continue
            try:
                raw = auth.get_raw(f"/templates/{template_id}/documents/{did}")
                safe = "".join(c for c in dname if c.isalnum() or c in "._- ").strip()
                safe = safe or f"attachment_{did}"
                file_path = docs_dir / safe
                if not file_path.exists():
                    file_path.write_bytes(raw)
                docs.append({
                    "document_id": did,
                    "name": dname,
                    "file_path": str(file_path),
                    "file_size": len(raw),
                    "file_hash": hashlib.sha256(raw).hexdigest(),
                    "doc_type": "template_document",
                    "type": doc.get("type", "content"),
                })
                print(f"    ✓ Document '{dname}' ({len(raw) / 1024:.0f}KB)")
            except Exception as exc:
                print(f"    [warn] Doc {did} ({dname}) download failed: {exc}")
    except Exception as exc:
        print(f"    [warn] Document list failed: {exc}")

    return docs


# ---------------------------------------------------------------------------
# Main download logic
# ---------------------------------------------------------------------------


def download_templates(
    account_name: str = "",
    search: str = "",
    force: bool = False,
    dry_run: bool = False,
) -> Dict[str, Any]:
    """Run incremental template download.

    Args:
        account_name: Account name to process (default: all accounts).
        search: Search filter for template names.
        force: Re-download even if already tracked.
        dry_run: Show what would be done without doing it.

    Returns:
        Summary dict.
    """
    auth = DocuSignAuth("prd")
    db_path = get_tracking_db_path("prd")
    db = TrackingDb(db_path)
    db.init_schema()

    all_accts = auth.list_accounts()
    if account_name:
        targets = [a for a in all_accts if account_name.lower() in a["name"].lower()]
    else:
        targets = all_accts

    if not targets:
        print("No accounts found.")
        db.close()
        return {"total": 0, "downloaded": 0, "errors": 0}

    print(f"{'='*60}")
    print(f" PRD Template Download — Incremental, GET-only")
    print(f"{'='*60}")
    print(f"  Search:  {search or '(all)'}")
    print(f"  Force:   {force}")
    print(f"  Dry run: {dry_run}")
    print()

    total_found = 0
    total_downloaded = 0
    total_errors = 0
    batch_id = db.get_batch_id()

    for acct in targets:
        acct_auth = DocuSignAuth("prd", account_guid=acct["guid"])
        print(f"\n--- Account: {acct['name']} ---")

        templates = _list_templates(acct_auth, search)
        if not templates:
            print("  No templates found.")
            continue

        print(f"  Found {len(templates)} template(s)")

        for tpl in templates:
            tpl_id = tpl.get("templateId", "")
            tpl_name = tpl.get("name", "(unnamed)")
            if not tpl_id:
                continue
            total_found += 1

            # Check if already downloaded
            if not force:
                existing = db.get_envelope(tpl_id)
                if existing:
                    print(f"  - {tpl_name}: already downloaded, skipping")
                    continue

            if dry_run:
                print(f"  - {tpl_name} ({tpl_id[:16]}...): would download")
                continue

            # Create template directory
            safe_name = _safe_name(tpl_name)
            tpl_dir = TEMPLATES_DIR / f"{safe_name}_{tpl_id[:8]}"
            tpl_dir.mkdir(parents=True, exist_ok=True)

            try:
                print(f"\n  [{total_found}] {tpl_name} ({tpl_id[:16]}...)")

                # 1. Download definition
                definition = _download_template_definition(acct_auth, tpl_id, tpl_dir, tpl_name)

                # 2. Download documents
                docs = _download_template_documents(acct_auth, tpl_id, tpl_dir, tpl_name)

                # 3. Store in SQLite
                db.upsert_envelope({
                    "envelope_id": tpl_id,
                    "account_id": acct["guid"],
                    "employee_name": tpl_name,
                    "template_id": tpl_id,
                    "template_name": tpl_name,
                    "status": "template",
                    "email_subject": definition.get("emailSubject", tpl_name),
                    "envelope_type": "template_definition",
                    "created_at": tpl.get("createdDateTime", ""),
                    "form_data_json": json.dumps(definition.get("recipients", {}), ensure_ascii=False),
                })

                # Record documents
                for d in docs:
                    db.record_document(
                        tpl_id, d["document_id"], d["name"],
                        d["file_path"], d["file_size"], d["file_hash"],
                        doc_type=d["doc_type"],
                    )

                total_downloaded += 1
                print(f"  ✓ Complete: {len(docs)} document(s)")

            except Exception as exc:
                total_errors += 1
                print(f"  ✗ Error: {exc}")

    db.close()

    print(f"\n{'='*60}")
    print(f" DOWNLOAD SUMMARY")
    print(f"{'='*60}")
    print(f"  Found:      {total_found}")
    print(f"  Downloaded: {total_downloaded}")
    print(f"  Errors:     {total_errors}")
    print(f"  Templates:  {TEMPLATES_DIR}")
    print(f"  Read-only:  ✓ (no PRD changes made)")

    return {
        "found": total_found,
        "downloaded": total_downloaded,
        "errors": total_errors,
        "batch_id": batch_id,
        "dry_run": dry_run,
    }


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


def show_stats():
    """Display template download statistics."""
    db = TrackingDb(get_tracking_db_path("prd"))
    db.init_schema()
    rows = db.get_envelopes(status="template", limit=5000)
    print(f"\nDownloaded Templates (PRD):")
    print(f"  Total: {len(rows)}")
    for r in rows:
        print(f"    - {r['employee_name']} ({r.get('envelope_id','?')[:16]}...)")
    db.close()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(
        description="DocuSign PRD Template Download — Incremental, GET-only",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--account", default="", help="Account name (default: all)")
    parser.add_argument("--search", default="", help="Search filter for template names")
    parser.add_argument("--force", action="store_true", help="Re-download even if tracked")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done")
    parser.add_argument("--status", action="store_true", help="Show download stats and exit")
    args = parser.parse_args()

    if args.status:
        show_stats()
        return

    try:
        result = download_templates(
            account_name=args.account,
            search=args.search,
            force=args.force,
            dry_run=args.dry_run,
        )
        sys.exit(1 if result["errors"] else 0)
    except Exception as exc:
        print(f"\nFATAL: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
