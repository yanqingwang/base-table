#!/usr/bin/env python3
"""Validate [citation:x] references against a Sources Inventory markdown.

Usage examples:
  python Script/validate_citations.py \
    --sources Reports/Iran-Analyze-Sources-Inventory-2026-04-03.md \
    Reports/伊朗冲突全球媒体态度分析报告-2026-04-03.md

Exit codes:
  0: ok
  2: missing citations (used but not defined)
  3: malformed citations
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys
from collections import defaultdict


CITATION_RE = re.compile(r"\[citation:(\d+)\]")
INVENTORY_LINE_RE = re.compile(r"^\s*(\d+)\s*\.")


def read_text(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8")


def parse_inventory_defined_numbers(inventory_text: str) -> set[int]:
    defined: set[int] = set()
    for line in inventory_text.splitlines():
        m = INVENTORY_LINE_RE.match(line)
        if not m:
            continue
        defined.add(int(m.group(1)))
    return defined


def parse_used_citations(md_text: str) -> list[int]:
    return [int(m.group(1)) for m in CITATION_RE.finditer(md_text)]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--sources",
        required=True,
        help="Path to Sources Inventory markdown (numbered list).",
    )
    ap.add_argument(
        "files",
        nargs="+",
        help="Markdown files to validate.",
    )
    args = ap.parse_args()

    sources_path = pathlib.Path(args.sources)
    if not sources_path.exists():
        print(f"ERROR: sources file not found: {sources_path}", file=sys.stderr)
        return 3

    inventory_text = read_text(sources_path)
    defined_numbers = parse_inventory_defined_numbers(inventory_text)
    if not defined_numbers:
        print(
            f"WARN: no numbered entries found in sources inventory: {sources_path}",
            file=sys.stderr,
        )

    missing_by_file: dict[pathlib.Path, set[int]] = {}
    used_by_file: dict[pathlib.Path, list[int]] = {}

    for file_str in args.files:
        p = pathlib.Path(file_str)
        if not p.exists():
            print(f"ERROR: file not found: {p}", file=sys.stderr)
            return 3
        text = read_text(p)
        used = parse_used_citations(text)
        used_by_file[p] = used
        missing = {n for n in used if n not in defined_numbers}
        if missing:
            missing_by_file[p] = missing

    if missing_by_file:
        print("Missing citations (used but not defined in sources inventory):")
        for p, missing in sorted(missing_by_file.items(), key=lambda kv: str(kv[0])):
            missing_sorted = ", ".join(str(n) for n in sorted(missing))
            print(f"- {p}: {missing_sorted}")
        return 2

    used_all: set[int] = set()
    for used in used_by_file.values():
        used_all.update(used)
    unused = sorted(n for n in defined_numbers if n not in used_all)
    if unused:
        unused_str = ", ".join(str(n) for n in unused)
        print(f"OK: all citations resolve. Unused sources in inventory: {unused_str}")
    else:
        print("OK: all citations resolve. No unused sources in inventory.")

    counts: dict[int, int] = defaultdict(int)
    for used in used_by_file.values():
        for n in used:
            counts[n] += 1
    if counts:
        top = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:15]
        top_str = ", ".join(f"{n}×{c}" for n, c in top)
        print(f"Most-used citations: {top_str}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
