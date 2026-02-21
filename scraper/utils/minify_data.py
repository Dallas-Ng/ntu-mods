"""
utils/minify_data.py
====================

Minifies all JSON files in the data/ directory in-place.

Useful if files were written with pretty-printing and you want to
reduce their size without re-scraping.

Usage:
    python3 utils/minify_data.py

    # Preview what would be minified without writing
    python3 utils/minify_data.py --dry-run

    # Minify a specific file
    python3 utils/minify_data.py data/02_courses_2025_2.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def minify_file(path: Path, dry_run: bool = False) -> None:
    """Minify a single JSON file in-place."""
    original_size = path.stat().st_size
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    minified = json.dumps(data, indent=None, ensure_ascii=False, separators=(",", ":"))
    new_size = len(minified.encode("utf-8"))
    saved = original_size - new_size
    pct = (saved / original_size * 100) if original_size else 0

    if saved <= 0:
        print(f"  {path.name}: already minified, skipping.")
        return

    if dry_run:
        print(f"  {path.name}: {_fmt(original_size)} -> {_fmt(new_size)} (saves {_fmt(saved)}, {pct:.0f}%) [dry run]")
        return

    with path.open("w", encoding="utf-8") as f:
        f.write(minified)
    print(f"  {path.name}: {_fmt(original_size)} -> {_fmt(new_size)} (saved {_fmt(saved)}, {pct:.0f}%)")


def _fmt(n: int) -> str:
    """Format a byte count as a human-readable string."""
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def main() -> None:
    parser = argparse.ArgumentParser(description="Minify JSON files in data/ in-place.")
    parser.add_argument(
        "files",
        nargs="*",
        metavar="FILE",
        help="Specific JSON file(s) to minify. Defaults to all *.json files in data/.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be minified without writing any changes.",
    )
    args = parser.parse_args()

    if args.files:
        targets = [Path(f) for f in args.files]
    else:
        targets = sorted(DATA_DIR.glob("*.json"))
        if not targets:
            print(f"No JSON files found in {DATA_DIR}.")
            return

    print(f"{'[dry run] ' if args.dry_run else ''}Minifying {len(targets)} file(s)...")
    for path in targets:
        minify_file(path, dry_run=args.dry_run)
    print("Done.")


if __name__ == "__main__":
    main()
