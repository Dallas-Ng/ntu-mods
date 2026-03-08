"""
stepfinal_upsync.py
===================

Copies the processed scraper output into the main project's src/data/api
directory, then generates derived lookup files used by the app.

Mapping:
    scraper/data/03_mdata_YYYY_S.json  ->  src/data/api/metadata/YYYY_S.json
    scraper/data/04_indexes_YYYY_S.json ->  src/data/api/indexes/YYYY_S.json
    scraper/data/05_exams_YYYY_S.json   ->  src/data/api/exams/YYYY_S.json
    scraper/data/01_semesters.json      ->  src/data/api/semesters.json  (if present)

Generated (from all metadata/indexes files in src/data/api/):
    src/data/api/module-map.json   -- { code: { title, au, indexKeys } } (latest semester wins)
    src/data/api/index-map.json    -- { indexKey: Index[] } (flat, all semesters merged)

Usage:
    python stepfinal_upsync.py
    python stepfinal_upsync.py --dry-run
"""

from __future__ import annotations

import argparse
import json
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


def build_derived_files(dry_run: bool = False) -> None:
    """Build module-map.json and index-map.json from all synced API files."""
    metadata_dir = API_DIR / "metadata"
    indexes_dir = API_DIR / "indexes"

    # Sort ascending so later files (latest semester) override earlier ones
    metadata_files = sorted(metadata_dir.glob("*.json"))
    indexes_files = sorted(indexes_dir.glob("*.json"))

    # Build index-map: indexKey -> Index[]
    # Flatten all index files; later files override earlier ones for same key
    index_map: dict[str, list] = {}
    for idx_file in indexes_files:
        obj = json.loads(idx_file.read_text(encoding="utf-8"))
        for _module_code, indexes_by_key in obj.items():
            for index_key, slots in indexes_by_key.items():
                index_map[index_key] = slots

    # Build module-map: code -> { title, au, indexKeys }
    # Also load indexes_files to attach indexKeys for each module from its latest semester
    module_map: dict[str, dict] = {}

    # First pass: build title/au from metadata (latest wins); record which semester is latest per module
    for meta_file in metadata_files:
        stem = meta_file.stem  # e.g. "2025_2"
        parts = stem.split("_", 1)
        file_year, file_sem = parts[0], parts[1]
        obj = json.loads(meta_file.read_text(encoding="utf-8"))
        for code, mod in obj.items():
            module_map[code] = {
                "title": mod.get("title", ""),
                "au": mod.get("au", "0"),
                "indexKeys": [],
                "currentYear": file_year,
                "currentSemester": file_sem,
            }

    # Second pass: attach indexKeys from the latest index file containing each module
    for idx_file in reversed(indexes_files):
        obj = json.loads(idx_file.read_text(encoding="utf-8"))
        for code, indexes_by_key in obj.items():
            if code in module_map and not module_map[code]["indexKeys"]:
                module_map[code]["indexKeys"] = list(indexes_by_key.keys())

    module_map_path = API_DIR / "module-map.json"
    index_map_path = API_DIR / "index-map.json"

    print(f"  -> src/data/api/module-map.json  ({len(module_map)} modules)")
    print(f"  -> src/data/api/index-map.json   ({len(index_map)} indexes)")

    if not dry_run:
        module_map_path.write_text(
            json.dumps(module_map, ensure_ascii=False),
            encoding="utf-8",
        )
        index_map_path.write_text(
            json.dumps(index_map, ensure_ascii=False),
            encoding="utf-8",
        )


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

    print("\nBuilding derived lookup files...")
    build_derived_files(dry_run=dry_run)


def main() -> None:
    parser = argparse.ArgumentParser(description="Upsync scraper output to src/data/api.")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be copied without writing anything.")
    args = parser.parse_args()

    print(f"{'[DRY RUN] ' if args.dry_run else ''}Upsyncing scraper/data -> src/data/api ...\n")
    upsync(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
