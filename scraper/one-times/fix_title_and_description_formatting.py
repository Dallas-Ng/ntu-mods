"""
fix_title_and_description_formatting.py
========================================

WHY THIS EXISTS
---------------
Before June 2026, step3_convert_mdata.py used Python's built-in .title() for
module titles, which incorrectly lowercased Roman numerals (e.g. "III" -> "Iii",
"IV" -> "Iv"). Descriptions also had two issues: missing spaces after sentence-
ending periods (e.g. "play.This"), and inline enumerated lists written as one
long semicolon-separated string ("(i) foo; (ii) bar") instead of separate items.

WHAT IT FIXES
-------------
- Titles: Roman numerals I-XX restored to full uppercase via smart_title().
- Descriptions: missing spaces after periods inserted.
- Descriptions: inline semicolon-separated lists ("(i) ...; (ii) ...") split
  onto separate lines so the frontend renders them as distinct paragraphs.
- Descriptions: multiple consecutive spaces collapsed.

IS THE PROBLEM RESOLVED FOR FUTURE RUNS?
-----------------------------------------
YES. step3_convert_mdata.py now uses smart_title() and _clean_description()
(added June 2026), so any semester re-scraped or newly scraped from that point
will produce clean data. This script only needs to be re-run if a historical
metadata file is regenerated from older raw scraper output that predates the fix.
It is safe to run multiple times (idempotent).

Usage:
    python scraper/one-times/fix_title_and_description_formatting.py [--dry-run]
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

METADATA_DIR = Path(__file__).parent.parent.parent / "src" / "data" / "api" / "metadata"

_ROMAN_NUMERALS = frozenset({
    "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
    "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
})

_INLINE_LIST_SEP = re.compile(
    r"\s*;\s*(?=\((?:ii{1,3}|iv|vi{0,3}|ix|x{1,3}|[2-9]|\d{2,}|[b-z])\))",
    re.IGNORECASE,
)


def smart_title(s: str) -> str:
    def _fix(m: re.Match) -> str:
        word = m.group(0).title()
        return word.upper() if word.upper() in _ROMAN_NUMERALS else word
    return re.sub(r"[A-Za-z]+", _fix, s)


def _clean_description(text: str) -> str:
    text = re.sub(r"\.([A-Z])", r". \1", text)
    text = _INLINE_LIST_SEP.sub("\n", text)
    if re.search(r"\n\((?:ii|iii|[2-9]|[b-z])\)", text, re.IGNORECASE):
        text = re.sub(r"(?<!\n)[ \t]+(\((?:i|1|a)\))[ \t]+", r"\n\1 ", text)
    text = re.sub(r'(?<=[^\s\n-])-\s+(?=[A-Z("])', r'\n- ', text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def fix_entry(entry: dict) -> bool:
    changed = False
    if "title" in entry:
        fixed = smart_title(entry["title"])
        if fixed != entry["title"]:
            entry["title"] = fixed
            changed = True
    if "description" in entry:
        fixed = _clean_description(entry["description"])
        if fixed != entry["description"]:
            entry["description"] = fixed
            changed = True
    return changed


def main(dry_run: bool = False) -> None:
    files = sorted(METADATA_DIR.glob("*.json"))
    if not files:
        print(f"No JSON files found in {METADATA_DIR}")
        return

    total_files = 0
    total_entries = 0

    for path in files:
        data: dict[str, dict] = json.loads(path.read_text(encoding="utf-8"))
        file_entries = 0

        for entry in data.values():
            if fix_entry(entry):
                file_entries += 1

        if file_entries:
            total_files += 1
            total_entries += file_entries
            print(f"  {path.name}: {file_entries} entries updated")
            if not dry_run:
                path.write_text(
                    json.dumps(data, ensure_ascii=False, separators=(",", ":")),
                    encoding="utf-8",
                )

    action = "Would update" if dry_run else "Updated"
    print(f"\n{action} {total_entries} entries across {total_files} files.")
    if dry_run:
        print("Re-run without --dry-run to apply changes.")


if __name__ == "__main__":
    main("--dry-run" in sys.argv)
