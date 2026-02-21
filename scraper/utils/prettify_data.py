"""
utils/prettify_data.py
======================

Pretty-prints all JSON files in the data/ directory in-place.

Useful for inspecting data in a human-readable format without re-scraping.

Usage:
    python3 utils/prettify_data.py

    # Preview what would be prettified without writing
    python3 utils/prettify_data.py --dry-run

    # Prettify a specific file
    python3 utils/prettify_data.py data/02_courses_2025_2.json

    # Use a custom indent level (default: 2)
    python3 utils/prettify_data.py --indent 4
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def prettify_file(path: Path, indent: int = 2, dry_run: bool = False) -> None:
    """Pretty-print a single JSON file in-place."""
    original_size = path.stat().st_size
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    prettified = json.dumps(data, indent=indent, ensure_ascii=False)
    new_size = len(prettified.encode("utf-8"))
    added = new_size - original_size
    pct = (added / original_size * 100) if original_size else 0

    if added <= 0:
        print(f"  {path.name}: already pretty-printed, skipping.")
        return

    if dry_run:
        print(f"  {path.name}: {_fmt(original_size)} -> {_fmt(new_size)} (+{_fmt(added)}, +{pct:.0f}%) [dry run]")
        return

    with path.open("w", encoding="utf-8") as f:
        f.write(prettified)
    print(f"  {path.name}: {_fmt(original_size)} -> {_fmt(new_size)} (+{_fmt(added)}, +{pct:.0f}%)")


def _fmt(n: int) -> str:
    """Format a byte count as a human-readable string."""
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def main() -> None:
    parser = argparse.ArgumentParser(description="Pretty-print JSON files in data/ in-place.")
    parser.add_argument(
        "files",
        nargs="*",
        metavar="FILE",
        help="Specific JSON file(s) to prettify. Defaults to all *.json files in data/.",
    )
    parser.add_argument(
        "--indent",
        type=int,
        default=2,
        metavar="N",
        help="Number of spaces to indent (default: 2).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be prettified without writing any changes.",
    )
    args = parser.parse_args()

    if args.files:
        targets = [Path(f) for f in args.files]
    else:
        targets = sorted(DATA_DIR.glob("*.json"))
        if not targets:
            print(f"No JSON files found in {DATA_DIR}.")
            return

    print(f"{'[dry run] ' if args.dry_run else ''}Prettifying {len(targets)} file(s)...")
    for path in targets:
        prettify_file(path, indent=args.indent, dry_run=args.dry_run)
    print("Done.")


if __name__ == "__main__":
    main()
