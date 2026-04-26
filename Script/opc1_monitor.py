#!/usr/bin/env python3
"""OPC1 minimal monitoring (盯盘) script.

Re-generates the company universe and vendor Top100 using the same logic as
`opc1_generate.py`, compares against the latest existing CSVs under Reports/,
and writes delta outputs (added/removed) since last run.
"""

from __future__ import annotations

import csv
import datetime as dt
import glob
import os
import sys
from typing import Iterable

from opc1_generate import (
    REPORTS_DIR,
    build_company_universe,
    build_top100_vendors,
    write_csv,
    write_text,
)


RUN_DATE = dt.date.today().isoformat()


def _latest_matching(pattern: str) -> str | None:
    paths = glob.glob(os.path.join(REPORTS_DIR, pattern))
    if not paths:
        return None
    return max(paths, key=os.path.getmtime)


def _read_csv_column(path: str, col: str) -> list[str]:
    with open(path, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        out: list[str] = []
        for row in r:
            v = (row.get(col) or "").strip()
            if v:
                out.append(v)
        return out


def _diff(old: Iterable[str], new: Iterable[str]) -> tuple[list[str], list[str]]:
    old_set = set(old)
    new_set = set(new)
    added = sorted(new_set - old_set)
    removed = sorted(old_set - new_set)
    return added, removed


def main() -> int:
    # Locate latest snapshots
    old_companies = _latest_matching("OPC1-demand-companies-500-china-*.csv")
    old_vendors = _latest_matching("OPC1-vendors-top100-hris-china-*.csv")

    if not old_companies or not old_vendors:
        raise RuntimeError("No existing OPC1 CSVs found in Reports/. Run opc1_generate.py first.")

    new_companies = build_company_universe()
    new_vendors = build_top100_vendors()

    old_company_names = _read_csv_column(old_companies, "company_name")
    new_company_names = [r["company_name"] for r in new_companies]

    old_vendor_names = _read_csv_column(old_vendors, "vendor_name")
    new_vendor_names = [v.vendor_name for v in new_vendors]

    companies_added, companies_removed = _diff(old_company_names, new_company_names)
    vendors_added, vendors_removed = _diff(old_vendor_names, new_vendor_names)

    # Write delta outputs
    companies_delta_csv = os.path.join(REPORTS_DIR, f"OPC1-monitor-delta-companies-{RUN_DATE}.csv")
    vendors_delta_csv = os.path.join(REPORTS_DIR, f"OPC1-monitor-delta-vendors-{RUN_DATE}.csv")
    delta_md = os.path.join(REPORTS_DIR, f"OPC1-monitor-delta-summary-{RUN_DATE}.md")

    write_csv(
        companies_delta_csv,
        ([{"change": "added", "company_name": n} for n in companies_added]
         + [{"change": "removed", "company_name": n} for n in companies_removed]),
        ["change", "company_name"],
    )
    write_csv(
        vendors_delta_csv,
        ([{"change": "added", "vendor_name": n} for n in vendors_added]
         + [{"change": "removed", "vendor_name": n} for n in vendors_removed]),
        ["change", "vendor_name"],
    )

    write_text(
        delta_md,
        """# OPC1 — 盯盘增量摘要\n\n"
        f"> 生成日期：{RUN_DATE}\n\n"
        f"对比基线：\n\n- 公司表：`{os.path.basename(old_companies)}`\n- 供应商表：`{os.path.basename(old_vendors)}`\n\n"
        "## 变化统计\n\n"
        f"- 公司：新增 {len(companies_added)}，移除 {len(companies_removed)}\n"
        f"- 供应商：新增 {len(vendors_added)}，移除 {len(vendors_removed)}\n\n"
        "## 明细\n\n"
        f"- 公司 delta CSV：`{os.path.basename(companies_delta_csv)}`\n"
        f"- 供应商 delta CSV：`{os.path.basename(vendors_delta_csv)}`\n",
    )

    print("Monitoring delta written:")
    print("-", os.path.basename(delta_md))
    print("-", os.path.basename(companies_delta_csv))
    print("-", os.path.basename(vendors_delta_csv))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        raise SystemExit(2)
