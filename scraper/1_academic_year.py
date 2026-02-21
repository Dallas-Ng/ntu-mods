"""
1_academic_year.py
===================

This script scrapes the NTU class schedule landing page and extracts the
academic semester identifiers available for querying schedules.  The
academic years and semesters are presented in a drop‑down list on the
`/aus_schedule.main` page【353616380788415†L83-L123】.  Each entry has a value
like ``2025;2`` (meaning Academic Year 2025 Semester 2) and a human‑readable
label (e.g. ``Acad Yr 2025 Semester 2``).  The script collects all such
entries and writes them to a JSON file in the same directory as the script.

Example JSON output::

    [
      {"code": "2025;2", "name": "Acad Yr 2025 Semester 2"},
      {"code": "2025;1", "name": "Acad Yr 2025 Semester 1"},
      ...
    ]

Usage:
    python 1_academic_year.py

Dependencies:
    - requests
    - beautifulsoup4

If you haven't installed them yet, run ``pip install requests beautifulsoup4``.
"""

from __future__ import annotations

import json
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from typing import List, Dict


def get_academic_years() -> List[Dict[str, str]]:
    """Fetch and parse available academic years/semesters from NTU schedule page.

    Returns
    -------
    list of dict
        Each dictionary has keys ``code`` (e.g. ``'2025;2'``) and ``name``
        (e.g. ``'Acad Yr 2025 Semester 2'``).

    Raises
    ------
    requests.HTTPError
        If the HTTP request fails.
    ValueError
        If the expected HTML elements are not found.
    """
    url = "https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/118.0.0.0 Safari/537.36"
        )
    }
    print(f"Downloading schedule landing page from {url}...")
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    select = soup.find("select", attrs={"name": "acadsem"})
    if not select:
        raise ValueError("Could not locate the academic year drop‑down on the page.")
    results: List[Dict[str, str]] = []
    for option in select.find_all("option"):
        code = option.get("value")
        name = option.get_text(strip=True)
        if code:
            results.append({"code": code, "name": name})
    print(f"Found {len(results)} academic semester entries.")
    return results


def main() -> None:
    """Run the scraper and write the JSON output to a file."""
    years = get_academic_years()
    # Determine output file name: same directory as this script, with .json suffix
    script_path = Path(__file__).resolve()
    output_path = script_path.with_suffix(".json")
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(years, f, indent=2, ensure_ascii=False)
    print(f"Wrote academic years to {output_path.name}")


if __name__ == "__main__":
    main()