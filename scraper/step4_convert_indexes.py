"""
step4_convert_indexes.py
========================

Converts the raw scraped course data produced by step2_scrape_courses.py
into the indexes format (as used in m-indexes.json).

Source format (02_courses_YYYY_S.json):
    { "<PROGRAMME_CODE>": [ { course_code, ..., schedules: [
        { index, type, group, day, time, venue, remark }
    ] } ] }

Target format (04_indexes_YYYY_S.json):
    { "<COURSE_CODE>": { "<INDEX_NUM>": [
        { key, type, group, day, time, venue, remarks, duration }
    ] } }

Where:
    - ``day`` is an integer (Mon=1 … Sun=7)
    - ``duration`` is ceil((end_time - start_time) / 30 min)
    - Slots sharing the same course code and index number are grouped together

Usage:
    python step4_convert_indexes.py data/02_courses_2025_2.json
    python step4_convert_indexes.py data/02_courses_2025_2.json data/04_indexes_2025_2.json
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent / "data"

DAY_MAP = {
    "MON": 1,
    "TUE": 2,
    "WED": 3,
    "THU": 4,
    "FRI": 5,
    "SAT": 6,
    "SUN": 7,
}


def _time_to_minutes(t: str) -> int:
    """Convert a ``HHMM`` string to minutes since midnight."""
    return int(t[:2]) * 60 + int(t[2:])


def _duration(time_range: str) -> int:
    """Return duration in 30-minute units, rounded up.

    Parameters
    ----------
    time_range:
        A ``"HHMM-HHMM"`` string, e.g. ``"1430-1720"``.
    """
    start_str, end_str = time_range.split("-")
    diff = _time_to_minutes(end_str) - _time_to_minutes(start_str)
    return math.ceil(diff / 30)


def convert(input_path: Path, output_path: Path, indent: Optional[int] = None) -> None:
    """Convert raw courses JSON to the indexes format and write the result.

    Parameters
    ----------
    input_path:
        Path to a ``02_courses_*.json`` file.
    output_path:
        Destination path for the ``04_indexes_*.json`` output.
    """
    with input_path.open("r", encoding="utf-8") as f:
        courses_data: dict[str, list[dict]] = json.load(f)

    # course_code -> index_key -> list of slot dicts
    result: dict[str, dict[str, list[dict]]] = {}

    for course_list in courses_data.values():
        for course in course_list:
            code: str = course["course_code"]
            if code not in result:
                result[code] = {}

            for slot in course.get("schedules", []):
                index_key: str = slot["index"]
                day_str: str = slot.get("day", "")
                day_int: Optional[int] = DAY_MAP.get(day_str.upper())

                time_range: str = slot.get("time", "")
                try:
                    dur = _duration(time_range) if "-" in time_range else 0
                except (ValueError, ZeroDivisionError):
                    dur = 0

                slot_entry = {
                    "key": index_key,
                    "type": slot.get("type", ""),
                    "group": slot.get("group", ""),
                    "day": day_int,
                    "time": time_range,
                    "venue": slot.get("venue", ""),
                    "remarks": slot.get("remark", ""),
                    "duration": dur,
                }

                if index_key not in result[code]:
                    result[code][index_key] = []

                # Avoid duplicates that arise from the same course appearing
                # across multiple programmes.
                if slot_entry not in result[code][index_key]:
                    result[code][index_key].append(slot_entry)

    # Sort by course code for deterministic output
    sorted_result = {code: result[code] for code in sorted(result)}

    output_path.parent.mkdir(exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(sorted_result, f, indent=indent, ensure_ascii=False)

    total_indexes = sum(len(indexes) for indexes in sorted_result.values())
    print(f"Converted {len(sorted_result)} courses, {total_indexes} indexes -> {output_path}")


def default_output_path(input_path: Path) -> Path:
    """Derive the default output path from the input filename.

    ``data/02_courses_2025_2.json`` -> ``data/04_indexes_2025_2.json``
    """
    stem = input_path.stem  # e.g. "02_courses_2025_2"
    suffix = stem.removeprefix("02_courses_")
    return input_path.parent / f"04_indexes_{suffix}.json"


def main() -> None:
    import argparse
    parser = argparse.ArgumentParser(description="Convert raw courses JSON to indexes format.")
    parser.add_argument("input", nargs="?", metavar="INPUT",
                        help="Path to a 02_courses_*.json file. Defaults to the most recently modified one.")
    parser.add_argument("output", nargs="?", metavar="OUTPUT",
                        help="Output path. Defaults to data/04_indexes_*.json derived from the input name.")
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
