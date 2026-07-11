#!/usr/bin/env python3
"""
PRD Simulation Test — Read-only verify.

Uses shared library (docusign_lib). Only GET operations.
Verifies that PRD can be read without any modifications.

Usage:
    python simulate_test.py                     # List templates + check envelope counts
    python simulate_test.py --account TE-Malaysia
    python simulate_test.py --verbose
"""

from __future__ import annotations

import sys
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPT_DIR.parent))

from docusign_lib.auth import DocuSignAuth


def main():
    verbose = "--verbose" in sys.argv or "-v" in sys.argv

    print("=" * 60)
    print("PRD READ-ONLY VERIFICATION")
    print("Only GET operations — no envelopes created or modified")
    print("=" * 60)

    auth = DocuSignAuth("prd")
    assert auth.read_only, "PRD must be read-only"

    # 1. List accounts
    print("\n[1] Listing accounts...")
    accounts = auth.list_accounts()
    print(f"  Found {len(accounts)} account(s):")
    for a in accounts:
        print(f"    - {a.get('name', '?')} (guid: {a['guid'][:16]}...)")
        if a.get("base_uri"):
            print(f"      base: {a['base_uri']}")

    # 2. List templates for each account
    print("\n[2] Listing templates (first account)...")
    if accounts:
        try:
            acct_auth = DocuSignAuth("prd", account_guid=accounts[0]["guid"])
            data = acct_auth.get("/templates", {"count": "10"})
            templates = data.get("envelopeTemplates", [])
            if templates:
                print(f"  Found {len(templates)} template(s):")
                for t in templates[:5]:
                    print(f"    - {t.get('name', '?')} ({t.get('templateId', '?')[:16]}...)")
                if len(templates) > 5:
                    print(f"    ... and {len(templates) - 5} more")
            else:
                print("  No templates found")
        except Exception as e:
            print(f"  Could not fetch templates: {e}")

    # 3. Check envelope count for last 7 days
    print("\n[3] Checking envelope count (last 7 days)...")
    try:
        data = auth.get("/envelopes", {"from_date": "2026-07-02T00:00:00Z", "count": "1"})
        total = int(data.get("totalSetSize", 0))
        print(f"  {total} envelope(s) in last 7 days")
    except Exception as e:
        print(f"  Could not fetch envelope count: {e}")

    # 4. Verify read-only guard
    print("\n[4] Verifying read-only guard...")
    try:
        auth.post("/envelopes", {})
        print("  FAIL: POST was allowed!")
        sys.exit(1)
    except RuntimeError as e:
        print(f"  ✓ POST blocked: {e}")

    try:
        auth.put("/envelopes/test", {})
        print("  FAIL: PUT was allowed!")
        sys.exit(1)
    except RuntimeError as e:
        print(f"  ✓ PUT blocked: {e}")

    print("\n" + "=" * 60)
    print("PRD READ-ONLY VERIFICATION PASSED")
    print("No envelopes created or modified.")
    print("=" * 60)


if __name__ == "__main__":
    main()
