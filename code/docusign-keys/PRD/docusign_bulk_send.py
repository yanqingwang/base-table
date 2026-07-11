#!/usr/bin/env python3
"""
PRD Bulk Send Validation — Read-only verify tool.

Uses shared library (docusign_lib). Only GET operations.
Validates that template data and recipient CSV are correctly formatted
without creating any envelopes.

Usage:
    python docusign_bulk_send.py --template-id GUID --csv data.csv --dry-run
    python docusign_bulk_send.py --template-id GUID --xlsx data.xlsx --dry-run
"""

from __future__ import annotations

import argparse
import csv
import io
import sys
from pathlib import Path
from typing import Any, Dict, List

_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR.parent))

from docusign_lib.auth import DocuSignAuth


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


def validate_template(auth: DocuSignAuth, template_id: str) -> bool:
    """Validate a template exists and fetch tab info. GET-only."""
    try:
        data = auth.get(f"/templates/{template_id}", {"include": "recipients,tabs"})
        name = data.get("name", "?")
        signers = data.get("recipients", {}).get("signers", [])
        print(f"  Template: {name} ({template_id[:16]}...)")
        print(f"  Signers:  {len(signers)}")
        for s in signers:
            tabs = s.get("tabs", {})
            tab_count = sum(len(v) for v in tabs.values() if isinstance(v, list))
            print(f"    - {s.get('roleName', '?')} ({tab_count} tabs)")
        return True
    except Exception as e:
        print(f"  ✗ Template validation failed: {e}")
        return False


def validate_data(auth: DocuSignAuth, template_id: str, rows: List[Dict[str, str]]) -> bool:
    """Validate data rows match template tabs. GET-only."""
    try:
        tpl = auth.get(f"/templates/{template_id}", {"include": "recipients,tabs"})
    except Exception as e:
        print(f"  ✗ Cannot fetch template tabs: {e}")
        return False

    # Collect expected tab labels from template
    expected_tabs = set()
    for s in tpl.get("recipients", {}).get("signers", []):
        for tab_type, tab_list in s.get("tabs", {}).items():
            if isinstance(tab_list, list):
                for t in tab_list:
                    label = t.get("tabLabel", "")
                    if label:
                        expected_tabs.add(label)

    print(f"  Template has {len(expected_tabs)} expected tab label(s)")
    if not expected_tabs:
        print("  (no tab labels found in template)")
        return True

    # Check each row
    all_ok = True
    for i, row in enumerate(rows):
        data_cols = set()
        for col, val in row.items():
            col_clean = col.strip()
            if col_clean and val and val.strip():
                # Strip prefix
                for pfx in ["HR Manager::", "Employee::", "Document Generation::"]:
                    if col_clean.startswith(pfx):
                        col_clean = col_clean[len(pfx):]
                        break
                data_cols.add(col_clean)

        matching = data_cols & expected_tabs
        missing = expected_tabs - data_cols
        extra = data_cols - expected_tabs
        print(f"  Row {i}: {row.get('Employee::Name', row.get('name', '?'))}")
        print(f"    matching: {len(matching)} tabs")
        if missing:
            print(f"    missing:  {len(missing)} (not fatal — template defaults)")
        if extra:
            print(f"    extra:    {list(extra)[:5]}...")

    return all_ok


def main():
    parser = argparse.ArgumentParser(description="PRD Bulk Send Validation (read-only)")
    parser.add_argument("--template-id", required=True, help="DocuSign template GUID")
    parser.add_argument("--csv", type=Path, help="CSV data file")
    parser.add_argument("--xlsx", type=Path, help="XLSX data file")
    parser.add_argument("--dry-run", action="store_true", default=True,
                       help="Validate only (always on — PRD is read-only)")
    args = parser.parse_args()

    print(f"\n{'=' * 60}")
    print(f" PRD Bulk Send Validation (read-only)")
    print(f"{'=' * 60}")
    print(f" Template: {args.template_id}")
    print(f" Note: PRD is read-only — no envelopes will be created")
    print()

    auth = DocuSignAuth("prd")
    assert auth.read_only

    # Validate template
    tpl_ok = validate_template(auth, args.template_id)
    if not tpl_ok:
        sys.exit(1)

    # Validate data
    if args.csv or args.xlsx:
        input_path = args.csv or args.xlsx
        rows = parse_file(input_path)
        print(f"\n  Data file: {input_path.name} ({len(rows)} rows)")
        validate_data(auth, args.template_id, rows)
    else:
        print("\n  No data file provided — template validation only")

    print(f"\n{'=' * 60}")
    print(f" Validation complete — no PRD changes made")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    main()
