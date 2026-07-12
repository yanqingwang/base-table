#!/usr/bin/env python3
"""
Contract Expiry Reminder — CLI tool + web API helper for tracking contracts.

Uses the shared ``docusign_lib`` library and the ``contracts`` table in the
tracking SQLite database. DEV mode prints notifications to stdout instead of
sending email.

CLI Usage::

    # Check contracts expiring within 30 days
    python contract_reminder.py --check

    # Check with custom reminder window
    python contract_reminder.py --check --days 60

    # Print reminder notifications to stdout (DEV mode)
    python contract_reminder.py --notify

    # Import contracts from CSV
    python contract_reminder.py --import-csv path.csv

    # List all active contracts
    python contract_reminder.py --list

Python API::

    from contract_reminder import get_expiring_contracts, send_reminder_notification
    from docusign_lib.tracking_db import TrackingDb

    db = TrackingDb(path)
    contracts = get_expiring_contracts(db, days=30)
    send_reminder_notification(contracts)
"""

from __future__ import annotations

import argparse
import csv
import io
import sys
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# Path setup — allows running from PRD/ directory
_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR.parent))  # for docusign_lib

from docusign_lib.auth import DocuSignAuth
from docusign_lib.tracking_db import TrackingDb
from docusign_lib.config import get_tracking_db_path


ENV = "dev"  # DEV mode: notifications go to stdout, not real email


# ---------------------------------------------------------------------------
# Public API (for web app integration)
# ---------------------------------------------------------------------------


def get_expiring_contracts(db: TrackingDb, days: int = 30) -> List[Dict[str, Any]]:
    """Return contracts expiring within *days* from today.

    Args:
        db: An initialised TrackingDb instance.
        days: Look-ahead window in days. Defaults to 30.

    Returns:
        List of contract dicts with end_date in (now, now + days).
    """
    return db.get_contracts(status="active", expiring_days=days)


def send_reminder_notification(contracts: List[Dict[str, Any]]) -> None:
    """Print reminder notifications for a list of expiring contracts.

    In DEV mode this prints to stdout. Swap the body for real SMTP/sendmail
    in production.
    """
    if not contracts:
        print("No expiring contracts to notify.")
        return

    today = date.today()
    for c in contracts:
        end = c.get("end_date", "unknown")
        remaining_days = _days_remaining(end, today)
        name = c.get("employee_name", "Unknown")
        email = c.get("employee_email", "unknown@example.com")
        dept = c.get("department", "")
        pos = c.get("position", "")
        ctype = c.get("contract_type", "")

        print("=" * 60)
        print(f"TO:       {email}")
        print(f"SUBJECT:  Contract Expiry Reminder — {name}")
        print(f"{'=' * 60}")
        print(f"  Employee:    {name}")
        print(f"  Department:  {dept}")
        print(f"  Position:    {pos}")
        print(f"  Contract:    {ctype}")
        print(f"  Expires:     {end}")
        print(f"  Days left:   {remaining_days}")
        print()
        print(f"  Dear HR Team,")
        print()
        print(f"  This is a reminder that the contract for {name} ({email})")
        print(f"  is set to expire on {end} ({remaining_days} days from today).")
        print(f"  Please take appropriate action — renewal, extension, or")
        print(f"  termination — before the expiry date.")
        print()
        print(f"  Regards,")
        print(f"  Contract Management System")
        print()


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _days_remaining(end_date_str: str, today: Optional[date] = None) -> int:
    """Return number of days between *today* and *end_date_str*."""
    if not end_date_str:
        return 0
    try:
        end = datetime.strptime(end_date_str[:10], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return 0
    today = today or date.today()
    delta = (end - today).days
    return max(delta, 0)


def _connect(db_path: Optional[Path] = None) -> TrackingDb:
    """Initialise and return a TrackingDb connection."""
    db_path = db_path or get_tracking_db_path(ENV)
    db = TrackingDb(db_path)
    db.init_schema()
    return db


def _print_contract(c: Dict[str, Any]) -> None:
    """Print a single contract row."""
    end = c.get("end_date", "")[:10] if c.get("end_date") else "N/A"
    remaining = _days_remaining(end) if end != "N/A" else 0
    print(f"  {c.get('contract_id', '?'):36s}  "
          f"{c.get('employee_name', ''):20s}  "
          f"{c.get('employee_email', ''):30s}  "
          f"{c.get('department', ''):15s}  "
          f"{c.get('contract_type', ''):12s}  "
          f"{end:10s}  "
          f"{remaining:3d}d")


# ---------------------------------------------------------------------------
# CLI operations
# ---------------------------------------------------------------------------


def cmd_check(db: TrackingDb, days: int) -> None:
    """Scan for contracts expiring within *days* and print a report."""
    contracts = get_expiring_contracts(db, days=days)
    today = date.today()

    print(f"\nContract Expiry Check — {today}")
    print(f"Window: next {days} day(s)")
    print(f"{'=' * 60}")
    print(f"Found {len(contracts)} expiring contract(s).\n")

    if not contracts:
        return

    print(f"{'ID':36s}  {'Name':20s}  {'Email':30s}  {'Department':15s}  "
          f"{'Type':12s}  {'End Date':10s}  {'Left'}")
    print("-" * 140)
    for c in contracts:
        _print_contract(c)
    print()

    # Summary by department
    dept_counts: Dict[str, int] = {}
    for c in contracts:
        dept = c.get("department", "Unknown")
        dept_counts[dept] = dept_counts.get(dept, 0) + 1
    print("By department:")
    for dept, count in sorted(dept_counts.items(), key=lambda x: -x[1]):
        print(f"  {dept:20s}: {count}")
    print()


def cmd_notify(db: TrackingDb, days: int) -> None:
    """Print reminder notifications for expiring contracts."""
    contracts = get_expiring_contracts(db, days=days)
    send_reminder_notification(contracts)
    print(f"\nSent {len(contracts)} notification(s). (DEV mode — printed to stdout)")


def cmd_import_csv(db: TrackingDb, csv_path: str) -> None:
    """Import contracts from a CSV file.

    Expected columns (case-insensitive):
        employee_name, employee_email, department, position,
        contract_type, start_date, end_date, reminder_days
    """
    path = Path(csv_path)
    if not path.exists():
        print(f"Error: file not found — {path}", file=sys.stderr)
        sys.exit(1)

    imported = 0
    skipped = 0
    errors = 0

    with open(path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        # Normalise column names to lowercase
        reader.fieldnames = [n.strip().lower() for n in reader.fieldnames] if reader.fieldnames else []

        for row in reader:
            try:
                name = row.get("employee_name", "").strip()
                email = row.get("employee_email", "").strip()
                if not name or not email:
                    skipped += 1
                    continue

                contract = {
                    "contract_id": str(uuid.uuid4()),
                    "employee_name": name,
                    "employee_email": email,
                    "department": row.get("department", "").strip(),
                    "position": row.get("position", "").strip(),
                    "contract_type": row.get("contract_type", "permanent").strip(),
                    "start_date": row.get("start_date", "").strip(),
                    "end_date": row.get("end_date", "").strip(),
                    "reminder_days": int(row.get("reminder_days", 30)),
                    "status": "active",
                }
                db.upsert_contract(contract)
                imported += 1
            except Exception as exc:
                print(f"  Error on row {imported + skipped + errors + 1}: {exc}", file=sys.stderr)
                errors += 1

    print(f"Imported: {imported}, Skipped (missing name/email): {skipped}, Errors: {errors}")


def cmd_list(db: TrackingDb, status: str = "active") -> None:
    """List all contracts with the given status."""
    contracts = db.get_contracts(status=status)

    print(f"\nContracts (status = {status}) — {len(contracts)} total\n")
    if not contracts:
        return

    print(f"{'ID':36s}  {'Name':20s}  {'Email':30s}  {'Department':15s}  "
          f"{'Type':12s}  {'End Date':10s}  {'Left'}")
    print("-" * 140)
    for c in contracts:
        _print_contract(c)
    print()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Contract Expiry Reminder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--check", action="store_true", help="Scan for expiring contracts and print report")
    parser.add_argument("--notify", action="store_true", help="Send reminder notifications (DEV: print to stdout)")
    parser.add_argument("--import-csv", metavar="PATH", default="", help="Import contracts from CSV file")
    parser.add_argument("--list", action="store_true", help="List all active contracts")
    parser.add_argument("--status", default="active", help="Contract status filter for --list (default: active)")
    parser.add_argument("--days", type=int, default=30, help="Reminder window in days (default: 30)")

    args = parser.parse_args()

    # Determine what to do
    actions = sum([args.check, args.notify, bool(args.import_csv), args.list])
    if actions == 0:
        parser.print_help()
        sys.exit(1)
    if actions > 1:
        print("Error: only one action allowed (--check / --notify / --import-csv / --list)", file=sys.stderr)
        sys.exit(1)

    db = _connect()

    try:
        if args.check:
            cmd_check(db, args.days)
        elif args.notify:
            cmd_notify(db, args.days)
        elif args.import_csv:
            cmd_import_csv(db, args.import_csv)
        elif args.list:
            cmd_list(db, args.status)
    finally:
        db.close()


if __name__ == "__main__":
    main()
