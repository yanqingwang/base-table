#!/usr/bin/env python3
"""
DocuSign Daily Usage Report — Shared library version.

import json
Refactored to use docusign_lib. GET-only, reads from API + SQLite.

Usage:
    python docusign_daily_usage.py                              # All accounts, prev month→today
    python docusign_daily_usage.py --date 2026-06-14           # Single date
    python docusign_daily_usage.py --from 2026-06-01 --to 2026-06-14
    python docusign_daily_usage.py --list-accounts             # List available accounts
    python docusign_daily_usage.py --env dev                   # DEV environment
    python docusign_daily_usage.py --db                        # Query from SQLite instead of API
"""

from __future__ import annotations

import argparse
import csv
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR.parent))

from docusign_lib.auth import DocuSignAuth
from docusign_lib.tracking_db import TrackingDb
from docusign_lib.config import get_tracking_db_path


def _get_envelope_templates(env_id: str, auth: DocuSignAuth) -> List[str]:
    try:
        data = auth.get(f"/envelopes/{env_id}/templates")
        return [t["templateId"] for t in data.get("templates", []) if t.get("templateId")]
    except Exception:
        return []


def build_report_from_api(
    auth: DocuSignAuth, from_date: str, to_date: str, account_tag: str = ""
) -> List[Dict[str, str]]:
    """Build usage report by querying API. GET-only."""
    rows: List[Dict[str, str]] = []
    tag = account_tag or auth.account_id

    print(f"\n[API] {tag}: fetching {from_date} → {to_date}...")
    params = {"from_date": f"{from_date}T00:00:00Z", "to_date": f"{to_date}T23:59:59Z"}
    envelopes = auth.get_paginated("/envelopes", params=params)
    print(f"  Found {len(envelopes)} envelope(s)")

    for i, env in enumerate(envelopes):
        env_id = env.get("envelopeId", "")
        if not env_id:
            continue

        sender_obj = env.get("sender", {})
        sender_name = sender_obj.get("userName", "") if isinstance(sender_obj, dict) else ""
        sender_email = sender_obj.get("email", "") if isinstance(sender_obj, dict) else ""

        env_type = "Manual (PowerForm/Web)"
        templates = _get_envelope_templates(env_id, auth)
        if templates:
            env_type = "API (Template)"

        recipients_str = ""
        try:
            recip = auth.get(f"/envelopes/{env_id}/recipients")
            parts = []
            for r in recip.get("signers", []):
                n, e = r.get("name", ""), r.get("email", "")
                if n and e:
                    parts.append(f"{n} <{e}>")
                elif e:
                    parts.append(e)
            for r in recip.get("carbonCopies", []):
                n, e = r.get("name", ""), r.get("email", "")
                if n and e:
                    parts.append(f"{n} <{e}> (CC)")
                elif e:
                    parts.append(f"{e} (CC)")
            recipients_str = "; ".join(parts)
        except Exception:
            recipients_str = "N/A"

        rows.append({
            "account": tag,
            "sender": f"{sender_name} <{sender_email}>" if sender_name else sender_email,
            "recipient": recipients_str,
            "envelope_name": env.get("emailSubject", ""),
            "envelope_id": env_id,
            "envelope_type": env_type,
            "status": env.get("status", ""),
            "created_date": env.get("createdDateTime", ""),
        })
        if (i + 1) % 10 == 0:
            print(f"    {i+1}/{len(envelopes)}...")
            time.sleep(0.3)

    return rows


def build_report_from_db(
    db: TrackingDb, from_date: str, to_date: str
) -> List[Dict[str, str]]:
    """Build usage report from SQLite (no API calls)."""
    rows: List[Dict[str, str]] = []
    envelopes = db.get_envelopes(from_date=from_date, to_date=to_date, limit=5000)

    for env in envelopes:
        sender = json.loads(env.get("raw_recipients_json", "{}")) if env.get("raw_recipients_json") else {}
        rows.append({
            "account": env.get("account_id", "")[:16],
            "sender": env.get("employee_name", ""),
            "recipient": f"{env.get('employee_name', '')} <{env.get('employee_email', '')}>",
            "envelope_name": env.get("email_subject", ""),
            "envelope_id": env.get("envelope_id", ""),
            "envelope_type": env.get("envelope_type", "api"),
            "status": env.get("status", ""),
            "created_date": env.get("created_at", ""),
        })
    return rows


def parse_args():
    parser = argparse.ArgumentParser(description="DocuSign Daily Usage Report")
    parser.add_argument("--env", choices=["prd", "dev"], default="prd")
    parser.add_argument("--date", help="Single date YYYY-MM-DD")
    parser.add_argument("--from", dest="from_date", help="Start date YYYY-MM-DD")
    parser.add_argument("--to", help="End date YYYY-MM-DD")
    parser.add_argument("--csv", default="", help="Output CSV path")
    parser.add_argument("--accounts", nargs="*", default=[])
    parser.add_argument("--list-accounts", action="store_true")
    parser.add_argument("--db", action="store_true", help="Query from SQLite instead of API")
    return parser.parse_args()


def main():
    args = parse_args()
    today = datetime.now(timezone.utc)

    auth = DocuSignAuth(args.env)

    if args.list_accounts:
        accts = auth.list_accounts()
        print(f"\n{'='*60}")
        print(f" Available Accounts ({args.env.upper()})")
        print(f"{'='*60}")
        for a in accts:
            print(f"  {a['name']}")
            print(f"    GUID: {a['guid']}")
            print(f"    Base: {a['base_uri']}")
            print()
        return

    from_date, to_date = "", ""
    if args.date:
        from_date = to_date = args.date
    elif args.from_date:
        from_date = args.from_date
        to_date = args.to or today.strftime("%Y-%m-%d")
    else:
        first = today.replace(day=1)
        prev_end = first - timedelta(days=1)
        from_date = prev_end.replace(day=1).strftime("%Y-%m-%d")
        to_date = today.strftime("%Y-%m-%d")

    csv_path = args.csv or f"docusign_usage_{from_date}_to_{to_date}_{args.env}.csv"

    all_rows: List[Dict[str, str]] = []

    if args.db:
        # Read from SQLite
        db = TrackingDb(get_tracking_db_path(args.env))
        db.init_schema()
        all_rows = build_report_from_db(db, from_date, to_date)
        db.close()
    else:
        # Read from API
        all_accts = auth.list_accounts()
        if args.accounts:
            selected = [a for a in all_accts if a["guid"] in args.accounts]
        else:
            selected = all_accts

        for acct in selected:
            acct_auth = DocuSignAuth(args.env, account_guid=acct["guid"])
            rows = build_report_from_api(acct_auth, from_date, to_date, account_tag=acct["name"])
            all_rows.extend(rows)

    if all_rows:
        fieldnames = ["account", "sender", "recipient", "envelope_name", "envelope_id",
                       "envelope_type", "status", "created_date"]
        with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_rows)
        print(f"\n{'─'*50}")
        print(f" ✓ CSV: {csv_path} ({len(all_rows)} rows)")
    else:
        print("\n No envelopes found.")


if __name__ == "__main__":
    main()
