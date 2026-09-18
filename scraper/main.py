"""
main.py
=======

Scrape one semester (or all) from the NTU portals, convert, check, publish.

    scrape   portal.py   -> data/02_courses_YYYY_S.json, data/02b_content_YYYY_S.json,
                            data/exams/exams-YYYY-YYYY-sN.csv
    convert  convert.py  -> data/03_mdata_YYYY_S.json, 04_indexes_YYYY_S.json, 05_exams_YYYY_S.json
    check    check.py    -> refuses to publish a broken or suspiciously shrunken semester
    publish  --load      -> Cloudflare D1 (scripts/db/load-semester.mjs)
             --upsync    -> src/data/api (commit + push this to update the site)

Scrapes are cached: an existing 02_courses / exam CSV is reused unless --refetch.
Conversion always re-runs (it's seconds). Semester codes are "YYYY;S" — quote
them in the shell, ';' is a separator.

    python3 main.py                                   # latest semester, scrape if not cached
    python3 main.py -s "2026;1" --refetch             # fresh scrape
    python3 main.py -s "2026;1" --scope exams --refetch --load --upsync
    python3 main.py -s all --from "2025;1" --load     # every semester from 2025;1 on
    python3 main.py -s "2026;1" --load --dry-run
"""

from __future__ import annotations

import argparse
import csv
import json
import shutil
import subprocess
from pathlib import Path

import check
import convert
import portal

SCRAPER_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRAPER_DIR / "data"
EXAMS_DIR = DATA_DIR / "exams"
REPO_ROOT = SCRAPER_DIR.parent
API_DIR = REPO_ROOT / "src" / "data" / "api"
SEMESTERS_PATH = DATA_DIR / "01_semesters.json"

#: Special Term and Teaching Term run after Semester 2 of the same academic year.
SEM_ORDER = {"1": 1, "2": 2, "S": 3, "T": 4}


def sort_key(acadsem: str) -> int:
    """Chronological key for "YYYY;S". Never trust the portal's list order —
    it interleaves years inconsistently (2025;S after 2025;1 but 2024;S last)."""
    year, sem = acadsem.split(";", 1)
    return int(year) * 10 + SEM_ORDER[sem]


def data_path(name: str, acadsem: str) -> Path:
    return DATA_DIR / f"{name}_{acadsem.replace(';', '_')}.json"


def exam_csv_path(acadsem: str) -> Path:
    year, sem = acadsem.split(";", 1)
    return EXAMS_DIR / f"exams-{year}-{int(year) + 1}-s{sem.lower()}.csv"


def write_json(path: Path, data, indent: int | None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=indent, ensure_ascii=False), encoding="utf-8")


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def scrape_courses(acadsem: str, workers: int, refetch: bool, indent: int | None) -> tuple[dict, dict]:
    courses_p, content_p = data_path("02_courses", acadsem), data_path("02b_content", acadsem)
    if not refetch and courses_p.exists() and content_p.exists():
        print(f"[Scrape] using cached {courses_p.name} + {content_p.name} (--refetch to update)")
        return read_json(courses_p), read_json(content_p)
    print(f"[Scrape] {acadsem} with {workers} workers")
    courses, content = portal.scrape_semester(acadsem, workers)
    write_json(courses_p, courses, indent)
    write_json(content_p, content, indent)
    print(f"[Scrape] {sum(map(len, courses.values()))} course rows across {len(courses)} programmes")
    return courses, content


def scrape_exams(acadsem: str, refetch: bool, plan_no: int | None) -> str | None:
    """Return exam CSV text, fetching from the portal if missing or --refetch."""
    path = exam_csv_path(acadsem)
    if refetch or not path.exists():
        rows = portal.fetch_exam_timetable(acadsem, plan_no)
        if rows:
            path.parent.mkdir(parents=True, exist_ok=True)
            with path.open("w", newline="", encoding="utf-8") as f:
                w = csv.writer(f, quoting=csv.QUOTE_ALL)
                w.writerow(convert.EXAM_CSV_HEADER)
                w.writerows(rows)
            print(f"[Exams] fetched {len(rows)} exams -> {path.name}")
        elif path.exists():
            print(f"[Exams] portal returned nothing; keeping existing {path.name}")
    if not path.exists():
        print(f"[Exams] no timetable for {acadsem} — writing empty exams file")
        return None
    return path.read_text(encoding="utf-8-sig")


def run_load(acadsem: str, scope: str | None, dry_run: bool, force: bool) -> None:
    cmd = ["node", "scripts/db/load-semester.mjs", "--sem", acadsem]
    cmd += ["--scope", scope] if scope else []
    cmd += ["--dry-run"] if dry_run else []
    cmd += ["--force"] if force else []
    print(f"[Load] {' '.join(cmd[1:])}")
    subprocess.run(cmd, cwd=REPO_ROOT, check=True)


def run_upsync(acadsem: str, scope: str | None, dry_run: bool) -> None:
    key = acadsem.replace(";", "_")
    pairs = [("03_mdata", "metadata"), ("04_indexes", "indexes")] if scope != "exams" else []
    pairs += [("05_exams", "exams")] if scope != "courses" else []
    for name, dest in pairs:
        src, dst = DATA_DIR / f"{name}_{key}.json", API_DIR / dest / f"{key}.json"
        print(f"[Upsync] {src.relative_to(REPO_ROOT)} -> {dst.relative_to(REPO_ROOT)}{' (dry run)' if dry_run else ''}")
        if not dry_run:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)


def process(acadsem: str, a: argparse.Namespace) -> None:
    indent = 2 if a.pretty else None
    print(f"\n=== {acadsem} ===")
    if a.scope != "exams":
        courses, content = scrape_courses(acadsem, a.workers, a.refetch, indent)
        mdata, indexes = convert.to_mdata(courses, content), convert.to_indexes(courses)
        write_json(data_path("03_mdata", acadsem), mdata, indent)
        write_json(data_path("04_indexes", acadsem), indexes, indent)
        print(f"[Convert] {len(mdata)} courses, {sum(map(len, indexes.values()))} indexes")
    if a.scope != "courses":
        csv_text = scrape_exams(acadsem, a.refetch, a.plan_no)
        exams = convert.to_exams(csv_text) if csv_text else {}
        write_json(data_path("05_exams", acadsem), exams, indent)
        print(f"[Convert] {len(exams)} exams")

    ok = check.check_semester(acadsem)
    if not (a.load or a.upsync):
        return
    if not ok and not a.force:
        raise SystemExit("Refusing to publish: fix the problems above or pass --force if the change is real.")
    if a.load:
        run_load(acadsem, a.scope, a.dry_run, a.force)
    if a.upsync:
        run_upsync(acadsem, a.scope, a.dry_run)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("-s", "--semester", default="latest", metavar="YYYY;S", help="'latest' (default), a code like '2026;1', or 'all'")
    p.add_argument("-w", "--workers", type=int, default=4, help="parallel requests (default 4)")
    p.add_argument("--refetch", action="store_true", help="ignore cached scrapes and hit the portal again")
    p.add_argument("--scope", choices=["courses", "exams"], help="only courses (02–04) or only exams (05); default both")
    p.add_argument("--plan-no", type=int, help="override the exam portal's p_plan_no (normally auto-detected)")
    p.add_argument("--pretty", action="store_true", help="indent JSON output")
    p.add_argument("--min-year", type=int, metavar="YYYY", help="with 'all': skip semesters before this year")
    p.add_argument("--from", dest="from_sem", metavar="YYYY;S", help="with 'all': this semester and newer")
    p.add_argument("--load", action="store_true", help="publish to D1 after checking")
    p.add_argument("--upsync", action="store_true", help="copy into src/data/api after checking (then commit + push)")
    p.add_argument("--dry-run", action="store_true", help="with --load/--upsync: show what would happen, change nothing")
    p.add_argument("--force", action="store_true", help="publish even if the check fails or D1 row counts drop sharply")
    a = p.parse_args()

    semesters = portal.fetch_semesters()
    write_json(SEMESTERS_PATH, semesters, 2 if a.pretty else None)
    codes = [s["code"] for s in semesters]
    print(f"[Semesters] {len(codes)} listed, newest {codes[0]}")

    if a.semester == "latest":
        targets = [codes[0]]
    elif a.semester == "all":
        targets = sorted(codes, key=sort_key)
        if a.from_sem:
            targets = [c for c in targets if sort_key(c) >= sort_key(a.from_sem)]
        elif a.min_year:
            targets = [c for c in targets if int(c.split(";")[0]) >= a.min_year]
    elif a.semester in codes:
        targets = [a.semester]
    else:
        raise SystemExit(f"'{a.semester}' is not a listed semester. Listed: {codes}")

    for sem in targets:
        process(sem, a)
    print("\nPipeline complete.")


if __name__ == "__main__":
    main()
