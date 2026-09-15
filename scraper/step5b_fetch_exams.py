"""
step5b_fetch_exams.py
======================

Fetches the exam timetable directly from NTU's public exam_timetable_und
endpoint and writes it in the same CSV format Step 5 expects, replacing
the manual "download CSV from portal" step in the runbook.

No login/cookie needed — the endpoint is public. Endpoint and params were
found via browser devtools; academic_session/p_exam_yr/p_semester/p_plan_no
must be updated by hand each semester (p_plan_no isn't documented anywhere,
found by trial from the query form).

Usage:
    python3 step5b_fetch_exams.py "2026;1" --plan-no 115

Output:
    data/exams/exams-YYYY-YYYY-sX.csv   (same format step5_convert_exams.py reads)
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

import requests

DATA_DIR = Path(__file__).parent / "data"
EXAMS_DIR = DATA_DIR / "exams"

ENDPOINT = "https://wis.ntu.edu.sg/webexe/owa/exam_timetable_und.Get_detail"

ROW_RE = re.compile(r"<tr[^>]*bgcolor=#[0-9A-Fa-f]+>(.*?)</tr>", re.S)
CELL_RE = re.compile(r"<td[^>]*>\s*(.*?)\s*</td>", re.S)


def parse_semester_arg(code: str) -> tuple[int, int]:
    year_str, sem_str = code.split(";")
    return int(year_str), int(sem_str)


def fetch_html(academic_session: str, exam_yr: int, semester: int, plan_no: int) -> str:
    form = {
        "p_exam_dt": "",
        "p_start_time": "",
        "p_dept": "",
        "p_subj": "",
        "p_venue": "",
        "p_matric": "",
        "academic_session": academic_session,
        "p_plan_no": plan_no,
        "p_exam_yr": exam_yr,
        "p_semester": semester,
        "p_type": "UE",
        "bOption": "Next",
    }
    resp = requests.post(ENDPOINT, data=form, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
    resp.raise_for_status()
    return resp.text


def parse_rows(html: str) -> list[list[str]]:
    rows = []
    for row_html in ROW_RE.findall(html):
        cells = CELL_RE.findall(row_html)
        if len(cells) >= 6:
            rows.append([c.strip() for c in cells[:6]])
    return rows


def write_csv(path: Path, rows: list[list[str]]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        writer.writerow(["Date", "Day", "Time", "Course", "Course Title", "Duration"])
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("semester", help='e.g. "2026;1"')
    parser.add_argument("--plan-no", type=int, required=True, help="p_plan_no query param, find via portal devtools")
    parser.add_argument("--out", help="Override output CSV path")
    args = parser.parse_args()

    exam_yr, semester = parse_semester_arg(args.semester)
    academic_session = f"Semester {semester} Academic Year {exam_yr}-{exam_yr + 1}"

    print(f"Fetching exam timetable: {academic_session} (plan_no={args.plan_no})...")
    html = fetch_html(academic_session, exam_yr, semester, args.plan_no)
    rows = parse_rows(html)

    if not rows:
        print("No exam rows found — check plan_no / academic_session, or portal hasn't released it yet.", file=sys.stderr)
        sys.exit(1)

    out_path = Path(args.out) if args.out else EXAMS_DIR / f"exams-{exam_yr}-{exam_yr + 1}-s{semester}.csv"
    EXAMS_DIR.mkdir(parents=True, exist_ok=True)
    write_csv(out_path, rows)
    print(f"Wrote {len(rows)} exam(s) -> {out_path}")


if __name__ == "__main__":
    main()
