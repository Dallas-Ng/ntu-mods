"""
stepfinal_upsync.py
===================

Copies the processed scraper output into the main project's src/data/api
directory.

Mapping:
    scraper/data/03_mdata_YYYY_S.json  ->  src/data/api/metadata/YYYY_S.json
    scraper/data/04_indexes_YYYY_S.json ->  src/data/api/indexes/YYYY_S.json
    scraper/data/01_semesters.json      ->  src/data/api/semesters.json  (if present)

Usage:
    python stepfinal_upsync.py
    python stepfinal_upsync.py --dry-run
"""

from __future__ import annotations

import argparse
import shutil
import re
from pathlib import Path

SCRAPER_DIR = Path(__file__).parent
DATA_DIR = SCRAPER_DIR / "data"
API_DIR = SCRAPER_DIR.parent / "src" / "data" / "api"

PATTERNS = [
    (re.compile(r"^03_mdata_(.+)\.json$"), API_DIR / "metadata"),
    (re.compile(r"^04_indexes_(.+)\.json$"), API_DIR / "indexes"),
]


def upsync(dry_run: bool = False) -> None:
    copied = 0

    for src_file in sorted(DATA_DIR.glob("*.json")):
        name = src_file.name

        for pattern, dest_dir in PATTERNS:
            match = pattern.match(name)
            if match:
                dest_file = dest_dir / f"{match.group(1)}.json"
                print(f"  {src_file.relative_to(SCRAPER_DIR)}  ->  {dest_file.relative_to(SCRAPER_DIR.parent)}")
                if not dry_run:
                    dest_dir.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src_file, dest_file)
                copied += 1
                break

        # Semesters
        if name == "01_semesters.json":
            dest_file = API_DIR / "semesters.json"
            print(f"  {src_file.relative_to(SCRAPER_DIR)}  ->  {dest_file.relative_to(SCRAPER_DIR.parent)}")
            if not dry_run:
                API_DIR.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_file, dest_file)
            copied += 1

    if copied == 0:
        print("Nothing to sync — no matching files found in scraper/data/.")
    else:
        suffix = " (dry run)" if dry_run else ""
        print(f"\nSynced {copied} file(s){suffix}.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Upsync scraper output to src/data/api.")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be copied without writing anything.")
    args = parser.parse_args()

    print(f"{'[DRY RUN] ' if args.dry_run else ''}Upsyncing scraper/data -> src/data/api ...\n")
    upsync(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
