"""
stepfinal_upsync.py
===================

Copies the processed scraper output into src/data/api.

Mapping:
    scraper/data/03_mdata_YYYY_S.json   ->  src/data/api/metadata/YYYY_S.json
    scraper/data/04_indexes_YYYY_S.json ->  src/data/api/indexes/YYYY_S.json
    scraper/data/05_exams_YYYY_S.json   ->  src/data/api/exams/YYYY_S.json

The app no longer reads any of these — D1 is the source of truth, and
``step6_load_d1`` (scripts/db/load-semester.mjs) is what actually publishes a
semester. This copy exists solely because Cloudflare Workers Builds has no
wrangler credentials and therefore cannot ``wrangler d1 export``; scripts/db/
sync-db.mjs rebuilds the database from these files when the build has no
other way to get one. Once the build environment can pull from D1 directly
(a scoped API token, or the file staged in R2), this whole step goes away.

Two files this used to generate are gone:
    module-map.json  -- replaced by ALL_MODULE_CODES_SQL / MODULE_TITLES_SQL
    index-map.json   -- had no consumers anywhere in the app; it was dead

semesters.json is no longer copied either. It is generated from the database by
scripts/build-static-data.mts, so that "the current semester" means the newest
semester that actually has offerings rather than whatever the portal happens to
be listing.

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
    (re.compile(r"^05_exams_(.+)\.json$"), API_DIR / "exams"),
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
