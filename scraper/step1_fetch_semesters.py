"""
step1_fetch_semesters.py
========================

Scrapes the NTU class schedule landing page and extracts the available
academic semester identifiers.  Each entry has a value like ``2025;2``
(Academic Year 2025 Semester 2) and a human-readable label.

Output: data/01_semesters.json

Example JSON output::

    [
      {"code": "2025;2", "name": "Acad Yr 2025 Semester 2"},
      {"code": "2025;1", "name": "Acad Yr 2025 Semester 1"},
      ...
    ]

Usage:
    python step1_fetch_semesters.py
"""

from __future__ import annotations

import json
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from typing import List, Dict

DATA_DIR = Path(__file__).parent / "data"
OUTPUT_PATH = DATA_DIR / "01_semesters.json"

SCHEDULE_URL = "https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/118.0.0.0 Safari/537.36"
    )
}


def get_academic_years() -> List[Dict[str, str]]:
    """Fetch and parse available academic years/semesters from the NTU schedule page.

    Returns
    -------
    list of dict
        Each dictionary has keys ``code`` (e.g. ``'2025;2'``) and ``name``
        (e.g. ``'Acad Yr 2025 Semester 2'``).

    Raises
    ------
    requests.HTTPError
        If the HTTP request fails.
    ValueError
        If the expected HTML elements are not found.
    """
    print(f"Downloading schedule landing page from {SCHEDULE_URL}...")
    resp = requests.get(SCHEDULE_URL, headers=HEADERS)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    select = soup.find("select", attrs={"name": "acadsem"})
    if not select:
        raise ValueError("Could not locate the academic year drop-down on the page.")

    results: List[Dict[str, str]] = []
    for option in select.find_all("option"):
        code = option.get("value")
        name = option.get_text(strip=True)
        if code:
            results.append({"code": code, "name": name})

    print(f"Found {len(results)} academic semester entries.")
    return results


def main() -> None:
    import argparse
    parser = argparse.ArgumentParser(description="Fetch available NTU academic semesters.")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON output.")
    args = parser.parse_args()

    DATA_DIR.mkdir(exist_ok=True)
    years = get_academic_years()
    indent = 2 if args.pretty else None
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(years, f, indent=indent, ensure_ascii=False)
    print(f"Wrote academic years to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
