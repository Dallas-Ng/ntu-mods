"""
step5_convert_exams.py
======================

Converts exam timetable CSV files in ``data/exams`` into per-semester JSON.

Source format:
    data/exams/exams-YYYY-YYYY-sX.csv

Target format:
    data/05_exams_YYYY_S.json

Where exam JSON is keyed by module code:
    {
      "SC2001": {
        "date": "24 April 2026",
        "day": 5,
        "start_time": "9.00 am",
        "end_time": "11.00 am",
        "key": "SC2001",
        "name": "ALGORITHM DESIGN & ANALYSIS",
        "duration": 4
      }
    }
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent / "data"
EXAMS_DIR = DATA_DIR / "exams"

CSV_NAME_RE = re.compile(r"^exams-(\d{4})-(\d{4})-s([a-zA-Z0-9]+)\.csv$")


def normalize_semester(token: str) -> Optional[str]:
    value = token.strip().lower()
    if value in {"1", "01"}:
        return "1"
    if value in {"2", "02"}:
        return "2"
    if value in {"s", "ss", "special"}:
        return "S"
    if value in {"t", "st"}:
        return "T"
    return None


def parse_date(value: str) -> datetime:
    return datetime.strptime(value.strip(), "%d %B %Y")


def parse_clock(value: str) -> datetime:
    return datetime.strptime(value.strip().lower(), "%I.%M %p")


def parse_duration_to_units(value: str) -> int:
    lower = value.strip().lower()
    hours = 0
    minutes = 0

    hr_match = re.search(r"(\d+)\s*hr", lower)
    if hr_match:
        hours = int(hr_match.group(1))

    min_match = re.search(r"(\d+)\s*min", lower)
    if min_match:
        minutes = int(min_match.group(1))

    total_minutes = hours * 60 + minutes
    return max(0, total_minutes // 30)


def fmt_day_month_year(dt: datetime) -> str:
    return dt.strftime("%d %B %Y").lstrip("0")


def fmt_time(dt: datetime) -> str:
    return dt.strftime("%I.%M %p").lstrip("0").lower()


def find_exam_csv(year: str, semester: str) -> Optional[Path]:
    for csv_path in sorted(EXAMS_DIR.glob("exams-*.csv")):
        match = CSV_NAME_RE.match(csv_path.name)
        if not match:
            continue
        file_year, _next_year, token = match.groups()
        file_sem = normalize_semester(token)
        if file_year == year and file_sem == semester:
            return csv_path
    return None


def output_path_for(year: str, semester: str) -> Path:
    return DATA_DIR / f"05_exams_{year}_{semester}.json"


def convert(year: str, semester: str, output_path: Path, indent: Optional[int] = None) -> None:
    csv_path = find_exam_csv(year, semester)
    result: dict[str, dict] = {}

    if csv_path is None:
        output_path.parent.mkdir(exist_ok=True)
        output_path.write_text(json.dumps(result, ensure_ascii=False, indent=indent), encoding="utf-8")
        print(f"No exam CSV found for {year};{semester}. Wrote empty {output_path.name}")
        return

    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        rows = [row for row in f if row.strip()]
        header_idx = next(
            (
                idx
                for idx, row in enumerate(rows)
                if next(csv.reader([row]))[:1] == ["Date"]
            ),
            None,
        )
        if header_idx is None:
            raise ValueError(f"Could not find CSV header row in {csv_path.name}")

        reader = csv.DictReader(rows[header_idx:])
        for row in reader:
            code = (row.get("Course") or "").strip().upper()
            if not code:
                continue

            date_str = (row.get("Date") or "").strip()
            time_str = (row.get("Time") or "").strip()
            duration_raw = (row.get("Duration") or "").strip()
            title = (row.get("Course Title") or "").strip()
            if not date_str or not time_str:
                continue

            start_dt = parse_clock(time_str)
            units = parse_duration_to_units(duration_raw)
            end_dt = start_dt + timedelta(minutes=units * 30)
            exam_date = parse_date(date_str)

            result[code] = {
                "date": fmt_day_month_year(exam_date),
                "day": exam_date.weekday() + 1,
                "start_time": fmt_time(start_dt),
                "end_time": fmt_time(end_dt),
                "key": code,
                "name": title,
                "duration": units,
            }

    output_path.parent.mkdir(exist_ok=True)
    output_path.write_text(
        json.dumps(dict(sorted(result.items())), ensure_ascii=False, indent=indent),
        encoding="utf-8",
    )
    print(f"Converted {len(result)} exams from {csv_path.name} -> {output_path.name}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert exam CSV data to semester exam JSON.")
    parser.add_argument(
        "semester",
        metavar="YYYY;S",
        help="Semester code in format YYYY;S (e.g. 2025;2).",
    )
    parser.add_argument(
        "output",
        nargs="?",
        metavar="OUTPUT",
        help="Output JSON path. Defaults to data/05_exams_YYYY_S.json.",
    )
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON output.")
    args = parser.parse_args()

    if ";" not in args.semester:
        raise SystemExit("Invalid semester format. Expected YYYY;S (e.g. 2025;2).")

    year, semester = args.semester.split(";", 1)
    semester = semester.upper()
    output_path = Path(args.output) if args.output else output_path_for(year, semester)
    indent = 2 if args.pretty else None
    convert(year, semester, output_path, indent=indent)


if __name__ == "__main__":
    main()
