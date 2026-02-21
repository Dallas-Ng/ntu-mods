"""
step3_convert_mdata.py
======================

Converts the raw scraped course data produced by step2_scrape_courses.py
into the mdata format consumed by downstream applications.

Source format (02_courses_YYYY_S.json):
    { "<PROGRAMME_CODE>": [ { course_code, course_title, credits,
                               prerequisite, remark, schedules } ] }

Target format (03_mdata_YYYY_S.json):
    { "<COURSE_CODE>": { searchKeys, code, title, au, prerequisite,
                         notAvailableToProgramme, description } }

Courses that appear in multiple programmes are merged: all programme codes
are collected into ``searchKeys``.

Usage:
    python step3_convert_mdata.py data/02_courses_2025_2.json
    python step3_convert_mdata.py data/02_courses_2025_2.json data/03_mdata_2025_2.json
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent / "data"


def parse_prerequisite(prereq_str: Optional[str]) -> list[list[str]]:
    """Parse a prerequisite string into a nested array.

    Examples
    --------
    "A & B OR C & D"  -> [["A", "B"], ["C", "D"]]
    "A OR B"          -> [["A"], ["B"]]
    "A & B"           -> [["A", "B"]]
    "A"               -> [["A"]]
    None              -> []
    """
    if not prereq_str:
        return []
    or_groups = re.split(r"\s+OR\s+", prereq_str.strip())
    result = []
    for group in or_groups:
        and_parts = [p.strip() for p in re.split(r"\s+&\s+", group) if p.strip()]
        if and_parts:
            result.append(and_parts)
    return result


def convert(input_path: Path, output_path: Path, indent: Optional[int] = None) -> None:
    """Convert raw courses JSON to mdata format and write the result.

    Parameters
    ----------
    input_path:
        Path to a ``02_courses_*.json`` file.
    output_path:
        Destination path for the ``03_mdata_*.json`` output.
    """
    with input_path.open("r", encoding="utf-8") as f:
        courses_data: dict[str, list[dict]] = json.load(f)

    result: dict[str, dict] = {}

    for search_key, course_list in courses_data.items():
        for course in course_list:
            code = course["course_code"]
            if code not in result:
                result[code] = {
                    "searchKeys": [],
                    "code": code,
                    "title": course["course_title"].title(),
                    "au": str(course["credits"]),
                    "prerequisite": parse_prerequisite(course.get("prerequisite")),
                    "notAvailableToProgramme": course.get("remark") or None,
                    "description": None,
                }
            if search_key not in result[code]["searchKeys"]:
                result[code]["searchKeys"].append(search_key)

    # Remove None-valued optional fields and empty prerequisite arrays
    clean_result: dict[str, dict] = {}
    for code, entry in sorted(result.items()):
        clean_entry = {k: v for k, v in entry.items() if v is not None}
        if clean_entry.get("prerequisite") == []:
            del clean_entry["prerequisite"]
        clean_result[code] = clean_entry

    output_path.parent.mkdir(exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(clean_result, f, indent=indent, ensure_ascii=False)

    print(f"Converted {len(clean_result)} courses -> {output_path}")


def default_output_path(input_path: Path) -> Path:
    """Derive the default output path from the input filename.

    ``data/02_courses_2025_2.json`` -> ``data/03_mdata_2025_2.json``
    """
    stem = input_path.stem  # e.g. "02_courses_2025_2"
    suffix = stem.removeprefix("02_courses_")
    return input_path.parent / f"03_mdata_{suffix}.json"


def main() -> None:
    import argparse
    parser = argparse.ArgumentParser(description="Convert raw courses JSON to mdata format.")
    parser.add_argument("input", nargs="?", metavar="INPUT",
                        help="Path to a 02_courses_*.json file. Defaults to the most recently modified one.")
    parser.add_argument("output", nargs="?", metavar="OUTPUT",
                        help="Output path. Defaults to data/03_mdata_*.json derived from the input name.")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON output.")
    args = parser.parse_args()

    if not args.input:
        candidates = sorted(DATA_DIR.glob("02_courses_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        if not candidates:
            print("No 02_courses_*.json files found in data/. Provide an input path explicitly.")
            sys.exit(1)
        input_path = candidates[0]
        print(f"No input specified; using most recent: {input_path.name}")
    else:
        input_path = Path(args.input)

    output_path = Path(args.output) if args.output else default_output_path(input_path)
    indent = 2 if args.pretty else None
    convert(input_path, output_path, indent=indent)


if __name__ == "__main__":
    main()
