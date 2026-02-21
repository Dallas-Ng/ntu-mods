#!/usr/bin/env python3
"""
Convert courses_2025_1.json to m-data format (m-data-s1.json).

Source format (courses_2025_1.json):
  { "<SCHOOL;PROG;AU;GRADING>": [ { course_code, course_title, credits,
                                     prerequisite, remark, schedules } ] }

Target format (m-data-s1.json):
  { "<COURSE_CODE>": { searchKeys, code, title, au, prerequisite,
                       notAvailableToProgramme, description } }
"""

import json
import re
import sys
from pathlib import Path


def parse_prerequisite(prereq_str: str | None) -> list[list[str]]:
    """
    Parse a prerequisite string into a nested array.

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


def convert(input_path: Path, output_path: Path) -> None:
    with open(input_path, "r", encoding="utf-8") as f:
        courses_data: dict[str, list[dict]] = json.load(f)

    # Build course_code -> merged entry, collecting all search keys
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

    # Remove None-valued optional fields to keep output clean
    clean_result: dict[str, dict] = {}
    for code, entry in sorted(result.items()):
        clean_entry = {k: v for k, v in entry.items() if v is not None}
        # prerequisite [] should still be omitted (empty means no prerequisite)
        if "prerequisite" in clean_entry and clean_entry["prerequisite"] == []:
            del clean_entry["prerequisite"]
        if "description" in clean_entry and clean_entry["description"] is None:
            del clean_entry["description"]
        clean_result[code] = clean_entry

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(clean_result, f, indent=2, ensure_ascii=False)

    print(f"Converted {len(clean_result)} courses -> {output_path}")


if __name__ == "__main__":
    script_dir = Path(__file__).parent

    input_file = Path(sys.argv[1]) if len(sys.argv) > 1 else script_dir / "courses_2025_1.json"
    output_file = Path(sys.argv[2]) if len(sys.argv) > 2 else script_dir / "m-data-s1-2025.json"

    convert(input_file, output_file)
