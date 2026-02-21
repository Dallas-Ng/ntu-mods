"""
main.py
=======

End-to-end pipeline for scraping NTU course schedule data.

Steps
-----
1. Fetch available academic semesters  ->  data/01_semesters.json
2. Scrape all courses for a semester   ->  data/02_courses_{YYYY}_{S}.json
3. Convert to mdata format             ->  data/03_mdata_{YYYY}_{S}.json

By default, existing data files are reused and steps are skipped if their
output already exists.  Use --refetch to ignore cached data and re-run
everything from scratch.

Usage
-----
    # Run the full pipeline (prompts for semester selection)
    python main.py

    # Specify a semester directly
    python main.py --semester 2025;2

    # Use parallel scraping (faster, be mindful of server load)
    python main.py --semester 2025;2 --workers 4

    # Scrape all semesters from 2025 onwards (whole year)
    python main.py --semester all --min-year 2025

    # Scrape from a specific semester onwards (e.g. 2025 Sem 2 and newer)
    python main.py --semester all --from 2025;2

    # Re-fetch everything, ignoring any cached data
    python main.py --semester 2025;2 --refetch
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Optional

from step1_fetch_semesters import get_academic_years, OUTPUT_PATH as SEMESTERS_PATH
from step2_scrape_courses import (
    choose_semester_interactively,
    scrape_courses_for_semester,
    output_path_for,
    write_courses,
    DATA_DIR,
)
from step3_convert_mdata import convert, default_output_path


def run_step1(refetch: bool, indent: Optional[int]) -> None:
    """Fetch academic semesters and write to data/01_semesters.json."""
    if not refetch and SEMESTERS_PATH.exists():
        print(f"[Step 1] Using cached {SEMESTERS_PATH.name} (pass --refetch to update).")
        return
    print("[Step 1] Fetching academic semesters...")
    DATA_DIR.mkdir(exist_ok=True)
    years = get_academic_years()
    with SEMESTERS_PATH.open("w", encoding="utf-8") as f:
        json.dump(years, f, indent=indent, ensure_ascii=False)
    print(f"[Step 1] Done — wrote {len(years)} semesters to {SEMESTERS_PATH.name}")


def run_step2(acadsem: str, max_workers: int, refetch: bool, indent: Optional[int]) -> Path:
    """Scrape courses for the given semester and write to data/."""
    out = output_path_for(acadsem)
    if not refetch and out.exists():
        print(f"[Step 2] Using cached {out.name} (pass --refetch to update).")
        return out
    print(f"[Step 2] Scraping courses for semester '{acadsem}'...")
    courses = scrape_courses_for_semester(acadsem, max_workers=max_workers)
    path = write_courses(acadsem, courses, indent=indent)
    total = sum(len(v) for v in courses.values())
    print(f"[Step 2] Done — {total} courses across {len(courses)} programmes -> {path.name}")
    return path


def run_step3(courses_path: Path, refetch: bool, indent: Optional[int]) -> None:
    """Convert raw courses JSON to mdata format."""
    out = default_output_path(courses_path)
    if not refetch and out.exists():
        print(f"[Step 3] Using cached {out.name} (pass --refetch to update).")
        return
    print(f"[Step 3] Converting {courses_path.name} to mdata...")
    convert(courses_path, out, indent=indent)
    print(f"[Step 3] Done — {out.name}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="NTU course scraper — end-to-end pipeline."
    )
    parser.add_argument(
        "--semester", "-s",
        metavar="YYYY;S",
        help="Semester to scrape (e.g. '2025;2'). Use 'all' for every available semester. "
             "Prompts interactively if omitted.",
    )
    parser.add_argument(
        "--workers", "-w",
        type=int,
        default=1,
        metavar="N",
        help="Number of parallel workers for scraping (default: 1).",
    )
    parser.add_argument(
        "--min-year",
        type=int,
        metavar="YYYY",
        help="Only scrape semesters from this year onwards (e.g. 2025). "
             "Only applies when --semester all is used.",
    )
    parser.add_argument(
        "--from",
        dest="from_semester",
        metavar="YYYY;S",
        help="Only scrape this semester and newer (e.g. '2025;2'). "
             "Only applies when --semester all is used.",
    )
    parser.add_argument(
        "--refetch",
        action="store_true",
        help="Ignore cached data and re-run all steps from scratch.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print JSON output with indentation (default: minified).",
    )
    args = parser.parse_args()

    indent = 2 if args.pretty else None

    # Step 1
    run_step1(refetch=args.refetch, indent=indent)

    # Determine semester
    acadsem = args.semester
    if not acadsem:
        acadsem = choose_semester_interactively()

    if acadsem.lower() == "all":
        from step2_scrape_courses import get_acadsem_programme_codes
        semesters, _ = get_acadsem_programme_codes()
        if args.from_semester:
            # The portal returns semesters newest-first; keep everything up to
            # and including the given semester code.
            if args.from_semester not in semesters:
                print(f"Error: '{args.from_semester}' not found in available semesters.")
                return
            cutoff = semesters.index(args.from_semester)
            semesters = semesters[: cutoff + 1]
            print(f"Filtered to {len(semesters)} semester(s) from '{args.from_semester}' onwards.")
        elif args.min_year:
            semesters = [s for s in semesters if int(s.split(";")[0]) >= args.min_year]
            print(f"Filtered to {len(semesters)} semester(s) from {args.min_year} onwards.")
        for sem in semesters:
            courses_path = run_step2(sem, max_workers=args.workers, refetch=args.refetch, indent=indent)
            run_step3(courses_path, refetch=args.refetch, indent=indent)
    else:
        courses_path = run_step2(acadsem, max_workers=args.workers, refetch=args.refetch, indent=indent)
        run_step3(courses_path, refetch=args.refetch, indent=indent)

    print("\nPipeline complete.")


if __name__ == "__main__":
    main()
