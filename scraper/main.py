"""
main.py
=======

End-to-end pipeline for scraping NTU course schedule data.

Steps
-----
1. Fetch available academic semesters  ->  data/01_semesters.json
2. Scrape all courses for a semester   ->  data/02_courses_{YYYY}_{S}.json
3. Convert to mdata format             ->  data/03_mdata_{YYYY}_{S}.json
4. Convert to indexes format           ->  data/04_indexes_{YYYY}_{S}.json
5. Convert exam CSVs to exam JSON      ->  data/05_exams_{YYYY}_{S}.json
6. Load into D1 (with --load)          ->  scripts/db/load-semester.mjs

--load publishes to D1, which the on-demand snapshot route reads live. It
does NOT update what prerendered pages or the client ship, which build from
src/data/api — run stepfinal_upsync.py afterwards and commit the result to
actually publish a semester to the rest of the site.

Everything from step 2 onwards is scoped to one semester: whatever is pulled
down for 2025;2 only ever describes 2025;2. That is why a load is a replace of
exactly one (semester, scope) rather than a merge — and why re-running a single
year, or rebuilding everything, is the same operation repeated.

By default, existing data files are reused and steps are skipped if their
output already exists.  Use --refetch to ignore cached data and re-run
everything from scratch.

Usage
-----
    # Run the full pipeline (prompts for semester selection)
    python main.py

    # Scrape and publish one semester
    python main.py --semester 2025;2 --load

    # Check what a load would do without touching D1
    python main.py --semester 2025;2 --load --dry-run

    # Re-publish only the exams for a semester, leaving courses alone
    python main.py --semester 2025;2 --load --scope exams

    # Use parallel scraping (faster, be mindful of server load)
    python main.py --semester 2025;2 --workers 4

    # Rebuild a whole year, or everything
    python main.py --semester all --min-year 2025 --load
    python main.py --semester all --refetch --load

    # Scrape from a specific semester onwards (e.g. 2025 Sem 2 and newer)
    python main.py --semester all --from 2025;2
"""

from __future__ import annotations

import argparse
import json
import subprocess
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
from step2b_scrape_content import (
    scrape_content_for_semester,
    output_path_for as content_output_path_for,
    write_content,
)
from step3_convert_mdata import convert, default_output_path
from step4_convert_indexes import convert as convert_indexes, default_output_path as default_indexes_path
from step5_convert_exams import convert as convert_exams, output_path_for as exams_output_path_for


#: Special Term and Teaching Term run after Semester 2 of the same academic year.
SEM_ORDER = {"1": 1, "2": 2, "S": 3, "T": 4}


def sort_key(acadsem: str) -> int:
    """Chronological ordering key for a "YYYY;S" semester code.

    Derived from the code itself, never from the portal's list order — see the
    comment at the ``--from`` filter for why that distinction matters.
    """
    year, semester = acadsem.split(";", 1)
    return int(year) * 10 + SEM_ORDER[semester]


def run_load(acadsem: str, scope: Optional[str], dry_run: bool, force: bool) -> None:
    """Load a scraped semester into D1 (scripts/db/load-semester.mjs).

    Replaces the old copy-into-src/data/api-and-commit step. The loader stages
    the semester locally, checks it against the previous load's row counts, and
    applies it as a single atomic file — a load either lands completely or not
    at all.
    """
    repo_root = Path(__file__).resolve().parent.parent
    cmd = ["node", str(repo_root / "scripts/db/load-semester.mjs"), "--sem", acadsem]
    if scope:
        cmd += ["--scope", scope]
    if dry_run:
        cmd.append("--dry-run")
    if force:
        cmd.append("--force")

    print(f"[Load] {' '.join(cmd[2:])}")
    subprocess.run(cmd, cwd=repo_root, check=True)


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


def run_step2b(acadsem: str, max_workers: int, refetch: bool, indent: Optional[int]) -> None:
    """Scrape course content (description, grade type, restrictions) for the semester."""
    out = content_output_path_for(acadsem)
    if not refetch and out.exists():
        print(f"[Step 2b] Using cached {out.name} (pass --refetch to update).")
        return
    print(f"[Step 2b] Scraping course content for semester '{acadsem}'...")
    content = scrape_content_for_semester(acadsem, max_workers=max_workers)
    write_content(acadsem, content, indent=indent)
    total = sum(len(v) for v in content.values())
    print(f"[Step 2b] Done — {total} courses across {len(content)} programmes -> {out.name}")


def run_step3(courses_path: Path, refetch: bool, indent: Optional[int]) -> None:
    """Convert raw courses JSON to mdata format."""
    out = default_output_path(courses_path)
    if not refetch and out.exists():
        print(f"[Step 3] Using cached {out.name} (pass --refetch to update).")
        return
    print(f"[Step 3] Converting {courses_path.name} to mdata...")
    convert(courses_path, out, indent=indent)
    print(f"[Step 3] Done — {out.name}")


def run_step4(courses_path: Path, refetch: bool, indent: Optional[int]) -> None:
    """Convert raw courses JSON to indexes format."""
    out = default_indexes_path(courses_path)
    if not refetch and out.exists():
        print(f"[Step 4] Using cached {out.name} (pass --refetch to update).")
        return
    print(f"[Step 4] Converting {courses_path.name} to indexes...")
    convert_indexes(courses_path, out, indent=indent)
    print(f"[Step 4] Done — {out.name}")


def run_step5(acadsem: str, refetch: bool, indent: Optional[int]) -> None:
    """Convert exam CSV data to semester exam JSON."""
    year, semester = acadsem.split(";", 1)
    out = exams_output_path_for(year, semester)
    if not refetch and out.exists():
        print(f"[Step 5] Using cached {out.name} (pass --refetch to update).")
        return
    print(f"[Step 5] Converting exam data for semester '{acadsem}'...")
    convert_exams(year, semester, out, indent=indent)
    print(f"[Step 5] Done — {out.name}")


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
    parser.add_argument(
        "--load",
        action="store_true",
        help="Load each scraped semester into D1 after converting it "
             "(scripts/db/load-semester.mjs). Without this, the pipeline only "
             "writes files under scraper/data/.",
    )
    parser.add_argument(
        "--scope",
        choices=["courses", "exams"],
        help="Restrict --load to one scope. Omit to load both. Re-running "
             "'courses' never touches exam rows, and vice versa.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="With --load, build the SQL and run the safety checks but do not "
             "apply anything to D1.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="With --load, apply even if row counts dropped sharply against "
             "the previous load. Only use when the drop is real.",
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
            # Compare by chronological sort key, never by position in the
            # portal's list. That list is not self-consistent — it returns
            # "2026;1 2025;2 2025;1 2025;S 2024;1 2024;2 2024;S", so AY2025 is
            # ordered 2,1,S while AY2024 is 1,2,S. Slicing it by index (which
            # this used to do) silently dropped 2025;S from `--from 2025;1`,
            # even though the Special Term is chronologically newer.
            if args.from_semester not in semesters:
                print(f"Error: '{args.from_semester}' not found in available semesters.")
                return
            cutoff = sort_key(args.from_semester)
            semesters = sorted(
                (s for s in semesters if sort_key(s) >= cutoff), key=sort_key
            )
            print(f"Filtered to {len(semesters)} semester(s) from '{args.from_semester}' onwards.")
        elif args.min_year:
            semesters = [s for s in semesters if int(s.split(";")[0]) >= args.min_year]
            print(f"Filtered to {len(semesters)} semester(s) from {args.min_year} onwards.")
        for sem in semesters:
            courses_path = run_step2(sem, max_workers=args.workers, refetch=args.refetch, indent=indent)
            run_step2b(sem, max_workers=args.workers, refetch=args.refetch, indent=indent)
            run_step3(courses_path, refetch=args.refetch, indent=indent)
            run_step4(courses_path, refetch=args.refetch, indent=indent)
            run_step5(sem, refetch=args.refetch, indent=indent)
            if args.load:
                run_load(sem, args.scope, args.dry_run, args.force)
    else:
        courses_path = run_step2(acadsem, max_workers=args.workers, refetch=args.refetch, indent=indent)
        run_step2b(acadsem, max_workers=args.workers, refetch=args.refetch, indent=indent)
        run_step3(courses_path, refetch=args.refetch, indent=indent)
        run_step4(courses_path, refetch=args.refetch, indent=indent)
        run_step5(acadsem, refetch=args.refetch, indent=indent)
        if args.load:
            run_load(acadsem, args.scope, args.dry_run, args.force)

    print("\nPipeline complete.")


if __name__ == "__main__":
    main()
