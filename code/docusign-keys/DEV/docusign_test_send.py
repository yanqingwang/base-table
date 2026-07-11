#!/usr/bin/env python3
"""
DocuSign DEV Test Sender — Shared library version with email override.

All emails are forced to wangyantsing@qq.com for safe testing.
Uses docusign_lib for auth, tracking, and config.

Usage:
    python docusign_test_send.py --template TEMPLATE_GUID --xlsx data.xlsx
    python docusign_test_send.py --template TEMPLATE_GUID --csv data.csv
    python docusign_test_send.py --template TEMPLATE_GUID --dry-run
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR.parent))

from docusign_lib.auth import DocuSignAuth
from docusign_lib.tracking_db import TrackingDb
from docusign_lib.config import get_tracking_db_path, get_email_override, apply_email_override

OVERRIDE_EMAIL = get_email_override("dev")  # wangyantsing@qq.com
DEFAULT_TEMPLATE = "a984ec81-9dc0-4480-9a27-55b3ce1c7d1b"  # DEV2


def parse_file(path: Path) -> List[Dict[str, str]]:
    """Parse CSV or XLSX file into row dicts."""
    suffix = path.suffix.lower()
    if suffix in {".xlsx", ".xlsm"}:
        import openpyxl
        wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
        ws = wb.active
        rows_iter = ws.iter_rows(values_only=True)
        headers = [str(h).strip() if h else "" for h in next(rows_iter)]
        rows = []
        for raw in rows_iter:
            if raw is None or all(c is None or (isinstance(c, str) and not c.strip()) for c in raw):
                continue
            row = {}
            for k, v in zip(headers, raw):
                row[k] = "" if v is None else str(v).strip()
            rows.append(row)
        wb.close()
        return rows
    else:
        with open(path, "r", encoding="utf-8-sig", newline="") as f:
            return list(csv.DictReader(f))


def send_envelope(
    auth: DocuSignAuth,
    template_id: str,
    row: Dict[str, str],
    role_name: str = "Employee",
    status: str = "created",
) -> Dict[str, Any]:
    """Send a single envelope from a template with email override applied."""
    # Apply email override to the row
    safe_row = apply_email_override(dict(row), OVERRIDE_EMAIL)

    name = safe_row.get("name", safe_row.get("Employee::Name", "Test User"))
    email = OVERRIDE_EMAIL  # Force override

    # Build tabs from non-email/name columns
    tabs: Dict[str, list] = {"textTabs": []}
    for col, val in safe_row.items():
        col_clean = col.strip()
        lc = col_clean.lower()
        if lc in ("name", "email", "employee::name", "employee::email", "hr manager::email", ""):
            continue
        if val and val.strip():
            # Strip prefix for tab label
            for prefix in ["HR Manager::", "Employee::", "Document Generation::"]:
                if col_clean.startswith(prefix):
                    col_clean = col_clean[len(prefix):]
                    break
            tabs["textTabs"].append({"tabLabel": col_clean, "value": val.strip()})

    payload = {
        "templateId": template_id,
        "templateRoles": [
            {"roleName": role_name, "name": name, "email": email, "tabs": tabs}
        ],
        "emailSubject": f"DEV Test: {name}",
        "status": status,
    }

    print(f"  Sending to {name} <{email}> ({len(tabs['textTabs'])} fields)...")
    return auth.post("/envelopes", payload)


def main():
    parser = argparse.ArgumentParser(description="DocuSign DEV Test Sender")
    parser.add_argument("--template", default=DEFAULT_TEMPLATE, help="Template GUID")
    parser.add_argument("--xlsx", type=Path, help="XLSX data file")
    parser.add_argument("--csv", type=Path, help="CSV data file")
    parser.add_argument("--role", default="Employee", help="Recipient role name")
    parser.add_argument("--status", choices=["created", "sent"], default="created")
    parser.add_argument("--dry-run", action="store_true", help="Validate without sending")
    parser.add_argument("--account", default="", help="Account GUID for multi-account")
    args = parser.parse_args()

    if not args.xlsx and not args.csv:
        print("Using built-in sample data")
        rows = [
            {"Employee::Name": "Test Alpha", "Employee::Email": "test@example.com",
             "Employee::Emp. No": "EMP001", "Employee::Country": "Malaysia"},
            {"Employee::Name": "Test Beta", "Employee::Email": "test@example.com",
             "Employee::Emp. No": "EMP002", "Employee::Country": "Malaysia"},
        ]
    else:
        rows = parse_file(args.xlsx or args.csv)

    print(f"\n{'='*60}")
    print(f" DEV Test Send — Email override: {OVERRIDE_EMAIL}")
    print(f"{'='*60}")
    print(f" Template: {args.template}")
    print(f" Rows:     {len(rows)}")
    print(f" Status:   {args.status}")
    print(f" Dry run:  {args.dry_run}")
    print()

    auth = DocuSignAuth("dev", account_guid=args.account)
    db = TrackingDb(get_tracking_db_path("dev"))
    db.init_schema()
    batch_id = db.get_batch_id()

    created = []
    errors = []

    for i, row in enumerate(rows):
        name = row.get("Employee::Name", row.get("name", f"Row_{i}"))
        print(f"\n[{i + 1}/{len(rows)}] {name}")

        if args.dry_run:
            safe = apply_email_override(dict(row), OVERRIDE_EMAIL)
            field_count = sum(1 for k, v in safe.items() if v and k.lower() not in ("name", "email"))
            print(f"  [DRY RUN] Would send: {OVERRIDE_EMAIL}, {field_count} fields")
            continue

        try:
            result = send_envelope(auth, args.template, row, args.role, args.status)
            env_id = result.get("envelopeId", "unknown")
            created.append(env_id)

            db.upsert_envelope({
                "envelope_id": env_id,
                "account_id": auth.account_id,
                "employee_name": name,
                "employee_email": OVERRIDE_EMAIL,
                "template_id": args.template,
                "status": result.get("status", args.status),
                "batch_id": batch_id,
            })
            db.mark_exported(env_id, batch_id, form_data_exported=True)
            print(f"  ✓ {env_id[:24]}...")

        except Exception as exc:
            errors.append({"name": name, "error": str(exc)})
            print(f"  ✗ {exc}")

    db.close()

    print(f"\n{'='*60}")
    print(f" RESULTS")
    print(f"{'='*60}")
    print(f"  Created: {len(created)}")
    print(f"  Errors:  {len(errors)}")
    print(f"  Batch:   {batch_id}")
    if errors:
        for e in errors:
            print(f"    ✗ {e['name']}: {e['error']}")
    print(f"  All emails forced to: {OVERRIDE_EMAIL}")
    print(f"  DEV only — no PRD impact")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
