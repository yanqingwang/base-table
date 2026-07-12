#!/usr/bin/env python3
"""
Compliance Export — Package completed envelope PDFs + metadata into a ZIP.

Exports a ZIP archive containing:
  - metadata/employees.csv   — all envelope metadata
  - metadata/form_data.csv   — form field values per envelope
  - manifest.json            — export metadata (date range, count, batch info)
  - pdfs/{name}_{id}.pdf     — combined envelope PDFs from disk

CLI:
    python compliance_export.py --from YYYY-MM-DD --to YYYY-MM-DD
        Create ZIP of completed envelopes in date range.

    python compliance_export.py --batch BATCH_ID
        Export a specific batch by export batch ID.

    python compliance_export.py --list
        List previous compliance exports.

    python compliance_export.py ... --env prd
        Switch between dev (default) and prd environments.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from zipfile import ZipFile, ZIP_DEFLATED

# Path setup
_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR.parent))  # for docusign_lib

from docusign_lib.tracking_db import TrackingDb
from docusign_lib.config import get_tracking_db_path, get_exports_dir


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _safe_name(s: str) -> str:
    """Filesystem-safe name: alphanumeric, dots, dashes, underscores."""
    cleaned = "".join(c for c in (s or "") if c.isalnum() or c in "._- ").strip()
    return "_".join(cleaned.split()) or "envelope"


def _human_size(bytes_: int) -> str:
    if bytes_ < 1024:
        return f"{bytes_} B"
    elif bytes_ < 1024 ** 2:
        return f"{bytes_ / 1024:.0f} KB"
    else:
        return f"{bytes_ / 1024 ** 2:.1f} MB"


# ---------------------------------------------------------------------------
# PDF discovery
# ---------------------------------------------------------------------------


def _find_pdfs(exports_dir: Path, env_id: str) -> List[Path]:
    """Find all PDFs for an envelope in the exports directory tree.

    Matches by the first 8 hex chars of the envelope ID (no hyphens),
    which is the convention used by docusign_bulk_export.py.
    """
    short_id = env_id.replace("-", "")[:8]
    if not short_id:
        return []
    return sorted(exports_dir.rglob(f"*{short_id}*.pdf"))


# ---------------------------------------------------------------------------
# Metadata builders
# ---------------------------------------------------------------------------


def _build_employees_csv(envelopes: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    return [
        {
            "employee_name": e.get("employee_name", ""),
            "employee_email": e.get("employee_email", ""),
            "template_name": e.get("template_name", ""),
            "status": e.get("status", ""),
            "created_at": (e.get("created_at") or "")[:19],
            "completed_at": (e.get("completed_at") or "")[:19],
            "envelope_id": e.get("envelope_id", ""),
        }
        for e in envelopes
    ]


def _build_form_data_csv(envelopes: List[Dict[str, Any]], db: TrackingDb) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    for env in envelopes:
        env_id = env["envelope_id"]
        form = db.get_form_data(env_id)
        if form:
            for label, value in form.items():
                rows.append({
                    "envelope_id": env_id,
                    "field_label": label,
                    "field_value": str(value),
                })
    return rows


# ---------------------------------------------------------------------------
# Query envelopes
# ---------------------------------------------------------------------------

_COMPLETED_STATUSES = ("completed", "signed", "delivered")


def _query_envelopes(
    db: TrackingDb,
    from_date: str,
    to_date: str,
    batch_id: str = "",
) -> List[Dict[str, Any]]:
    """Fetch envelopes matching the export criteria."""
    if batch_id:
        rows = db.conn.execute(
            "SELECT e.* FROM envelopes e "
            "JOIN export_tracking et ON e.envelope_id = et.envelope_id "
            "WHERE et.export_batch = ? "
            "ORDER BY e.created_at ASC",
            (batch_id,),
        ).fetchall()
        return [dict(r) for r in rows]

    # Build status filter — include multiple completed-like statuses
    placeholders = ", ".join("?" for _ in _COMPLETED_STATUSES)
    rows = db.conn.execute(
        "SELECT * FROM envelopes "
        "WHERE status IN ({}) "
        "AND completed_at >= ? AND completed_at <= ? "
        "ORDER BY completed_at ASC".format(placeholders),
        list(_COMPLETED_STATUSES) + [f"{from_date}T00:00:00Z", f"{to_date}T23:59:59Z"],
    ).fetchall()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Core export
# ---------------------------------------------------------------------------


def create_compliance_export(
    from_date: str = "",
    to_date: str = "",
    batch_id: str = "",
    env: str = "dev",
) -> Dict[str, Any]:
    """Create a compliance export ZIP and record it in the tracking DB.

    Args:
        from_date: Start date YYYY-MM-DD (required if no batch_id).
        to_date: End date YYYY-MM-DD (defaults to today).
        batch_id: Export a specific batch instead of date range.
        env: "dev" or "prd".

    Returns:
        Summary dict with export_id, file_path, envelope_count.
    """
    env_name = env.lower()
    db_path = get_tracking_db_path(env_name)
    db = TrackingDb(db_path)
    db.init_schema()
    exports_dir = get_exports_dir(env_name)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if batch_id:
        export_type = f"batch_{batch_id}"
        date_from = from_date or today
        date_to = to_date or today
        envelopes = _query_envelopes(db, "", "", batch_id=batch_id)
        if not envelopes:
            print(f"No envelopes found for batch: {batch_id}")
            db.close()
            return {"export_id": "", "envelope_count": 0, "file_path": ""}
        # Derive actual date range from envelope data
        dates = [e.get("completed_at", "")[:10] for e in envelopes if e.get("completed_at")]
        if dates:
            date_from = min(dates)
            date_to = max(dates)
    else:
        date_from = from_date or today
        date_to = to_date or today
        export_type = "date_range"
        envelopes = _query_envelopes(db, date_from, date_to)

    if not envelopes:
        print(f"No completed envelopes found for: {date_from} → {date_to}")
        db.close()
        return {"export_id": "", "envelope_count": 0, "file_path": ""}

    # Generate a unique export ID
    export_id = f"compliance_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
    compliance_dir = exports_dir / "compliance"
    compliance_dir.mkdir(parents=True, exist_ok=True)
    zip_path = compliance_dir / f"{export_id}.zip"

    # Build metadata
    employees = _build_employees_csv(envelopes)
    form_rows = _build_form_data_csv(envelopes, db)

    # Find PDFs on disk
    # ponytail: linear scan of exports dir per envelope; OK for typical volumes
    pdf_pairs: List[tuple] = []  # (original_path, archive_name)
    for env in envelopes:
        env_id = env["envelope_id"]
        name = env.get("employee_name", "unknown")
        found = _find_pdfs(exports_dir, env_id)
        if not found:
            print(f"  [warn] No PDFs for {env_id[:20]}... ({name})")
        for pdf in found:
            pdf_pairs.append((pdf, f"pdfs/{pdf.name}"))

    total_bytes = 0

    with ZipFile(str(zip_path), "w", ZIP_DEFLATED) as zf:
        # -- metadata/employees.csv
        buf = io.StringIO()
        fields = ["employee_name", "employee_email", "template_name",
                   "status", "created_at", "completed_at", "envelope_id"]
        w = csv.DictWriter(buf, fieldnames=fields)
        w.writeheader()
        w.writerows(employees)
        zf.writestr("metadata/employees.csv", buf.getvalue().encode("utf-8-sig"))

        # -- metadata/form_data.csv
        if form_rows:
            buf = io.StringIO()
            fields_fd = ["envelope_id", "field_label", "field_value"]
            w = csv.DictWriter(buf, fieldnames=fields_fd)
            w.writeheader()
            w.writerows(form_rows)
            zf.writestr("metadata/form_data.csv", buf.getvalue().encode("utf-8-sig"))

        # -- manifest.json
        manifest = {
            "export_id": export_id,
            "export_type": export_type,
            "env": env_name,
            "date_from": date_from,
            "date_to": date_to,
            "envelope_count": len(envelopes),
            "pdf_count": len(pdf_pairs),
            "batch_id": batch_id or "",
            "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        zf.writestr("manifest.json", json.dumps(manifest, indent=2, ensure_ascii=False))

        # -- pdfs/ (deduplicate archive paths)
        seen: set = set()
        for orig_path, archive_name in pdf_pairs:
            if archive_name in seen:
                stem = Path(archive_name).stem
                suffix = Path(archive_name).suffix
                n = 1
                while archive_name in seen:
                    archive_name = f"pdfs/{stem}_{n}{suffix}"
                    n += 1
            seen.add(archive_name)
            zf.write(str(orig_path), archive_name)
            total_bytes += orig_path.stat().st_size

    # Record in the compliance_exports table
    db.record_compliance_export(
        export_id=export_id,
        export_type=export_type,
        date_from=date_from,
        date_to=date_to,
        envelope_count=len(envelopes),
        total_size_bytes=total_bytes,
        file_path=str(zip_path),
    )
    db.close()

    print(f"\nCompliance export created:")
    print(f"  Export ID:   {export_id}")
    print(f"  File:        {zip_path}")
    print(f"  Envelopes:   {len(envelopes)}")
    print(f"  PDF files:   {len(pdf_pairs)}  ({_human_size(total_bytes)})")
    print(f"  Date range:  {date_from} → {date_to}")
    print(f"  Environment: {env_name.upper()}")

    return {
        "export_id": export_id,
        "file_path": str(zip_path),
        "envelope_count": len(envelopes),
        "pdf_count": len(pdf_pairs),
        "total_size_bytes": total_bytes,
    }


# ---------------------------------------------------------------------------
# List exports
# ---------------------------------------------------------------------------


def list_exports(env: str = "dev") -> None:
    """Display previous compliance exports."""
    db = TrackingDb(get_tracking_db_path(env.lower()))
    db.init_schema()
    exports = db.get_compliance_exports(limit=50)
    db.close()

    if not exports:
        print("No compliance exports found.")
        return

    print(f"\nCompliance Exports ({env.upper()}):")
    header = f"{'Export ID':<48} {'Type':<20} {'From':<12} {'To':<12} {'Count':<7} {'Size':<10}"
    print(header)
    print("-" * len(header))
    for ex in exports:
        eid = ex.get("export_id", "")
        etype = ex.get("export_type", "")[:18]
        d_from = (ex.get("date_from") or "")[:10]
        d_to = (ex.get("date_to") or "")[:10]
        cnt = ex.get("envelope_count", 0)
        size = _human_size(ex.get("total_size_bytes", 0))
        print(f"{eid:<48} {etype:<20} {d_from:<12} {d_to:<12} {cnt:<7} {size:<10}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compliance Export — Package completed envelope PDFs + metadata into a ZIP",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--from", dest="from_date", default="",
                        help="Start date YYYY-MM-DD (default: today)")
    parser.add_argument("--to", default="",
                        help="End date YYYY-MM-DD (default: today)")
    parser.add_argument("--batch", default="",
                        help="Export a specific batch by batch ID")
    parser.add_argument("--list", action="store_true",
                        help="List previous compliance exports")
    parser.add_argument("--env", default="dev", choices=["dev", "prd"],
                        help="Environment (default: dev)")

    args = parser.parse_args()

    if args.list:
        list_exports(args.env)
        return

    if args.batch and (args.from_date or args.to):
        print("Error: --batch cannot be combined with --from/--to", file=sys.stderr)
        sys.exit(1)

    try:
        result = create_compliance_export(
            from_date=args.from_date,
            to_date=args.to,
            batch_id=args.batch,
            env=args.env,
        )
        sys.exit(0 if result["envelope_count"] else 1)
    except Exception as exc:
        print(f"\nFATAL: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
