"""
step2b_scrape_content.py
========================

Scrapes course content (description, grade type, mutual exclusions, programme
restrictions) from the NTU course-content portal for a given semester.

The schedule portal (step2) only exposes Prerequisite and Remark fields.
This script targets the separate content portal:

    https://wis.ntu.edu.sg/webexe/owa/AUS_SUBJ_CONT.main_display1

which contains the fields shown in the NTU "Content of Courses" booklet.

Output is written to ``data/02b_content_{YYYY}_{S}.json`` with the same
programme → course list structure as step2's output, so the two can be
merged in step3.

Usage:
    python step2b_scrape_content.py 2025;2
    python step2b_scrape_content.py 2025;2 --workers 4
    python step2b_scrape_content.py          # interactive semester selection
"""

from __future__ import annotations

import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup

from step2_scrape_courses import (
    get_acadsem_programme_codes,
    choose_semester_interactively,
    DATA_DIR,
    HEADERS,
)

CONTENT_DISPLAY_URL = "https://wis.ntu.edu.sg/webexe/owa/AUS_SUBJ_CONT.main_display1"


# ---------------------------------------------------------------------------
# acadsem format conversion
# ---------------------------------------------------------------------------

def to_content_acadsem(acadsem: str) -> Tuple[str, str, str]:
    """Convert ``'2025;2'`` to ``('2025_2', '2025', '2')`` for the content portal."""
    year, sem = acadsem.split(";", 1)
    return f"{year}_{sem}", year, sem


# ---------------------------------------------------------------------------
# HTML parsing
# ---------------------------------------------------------------------------

def parse_content_html(html_text: str) -> List[Dict[str, object]]:
    """Parse AUS_SUBJ_CONT.main_display1 HTML into course content records.

    Each course is represented as a ``<table>`` with:
    - Row 0: code | title | AU (3 cells, last contains "AU")
    - Rows 1+: ``Label: `` | value  (2 cells, first ends with ``:``)
    - Last row: description text  (1 cell with ``colspan="3"``)

    Returns
    -------
    list of dict
        Each dict has keys: ``course_code``, ``course_title``, ``fields``,
        ``description``.
    """
    soup = BeautifulSoup(html_text, "html.parser")
    courses: List[Dict[str, object]] = []

    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        if not rows:
            continue

        # Identify header row: 3 cells, last contains "AU"
        first_cells = rows[0].find_all(["td", "th"])
        if len(first_cells) < 3:
            continue
        au_text = first_cells[-1].get_text(strip=True)
        if "AU" not in au_text:
            continue

        code = first_cells[0].get_text(strip=True)
        title = re.sub(r"[\*~#]+$", "", first_cells[1].get_text(strip=True)).strip()
        if not code:
            continue

        fields: Dict[str, str] = {}
        description: Optional[str] = None
        current_label: Optional[str] = None

        for row in rows[1:]:
            cells = row.find_all(["td", "th"])
            if not cells:
                continue

            first = cells[0]
            colspan = first.get("colspan")

            # Single-cell row (colspan=2 or 3): either a "Not offered" flag or
            # the description paragraph.
            # Distinguish by presence of <b> bold tag:
            #   <b> present  → "Not offered as …" boolean flag (store with value "true")
            #   <b> absent   → plain description paragraph
            if colspan in ("2", "3", 2, 3) or len(cells) == 1:
                text = first.get_text(" ", strip=True)
                if not text:
                    continue
                if first.find("b"):
                    # Boolean flag row — store as field with value "true"
                    fields[text] = "true"
                    current_label = None
                else:
                    # Description paragraph (no bold formatting)
                    description = text
                    current_label = None
                continue

            label_raw = first.get_text(strip=True)

            # Continuation row: empty first cell, append to previous label
            if not label_raw and current_label:
                continuation = " ".join(
                    c.get_text(" ", strip=True) for c in cells[1:]
                ).strip()
                if continuation:
                    fields[current_label] = (
                        fields[current_label] + " " + continuation
                    ).strip()
                continue

            if len(cells) < 2 or not label_raw.endswith(":"):
                current_label = None
                continue

            label = label_raw.rstrip(":").strip()
            value = " ".join(c.get_text(" ", strip=True) for c in cells[1:]).strip()
            current_label = label
            if value:
                fields[label] = (
                    (fields[label] + " " + value).strip()
                    if label in fields
                    else value
                )

        courses.append({
            "course_code": code,
            "course_title": title,
            "fields": fields,
            "description": description,
        })

    return courses


# ---------------------------------------------------------------------------
# Programme content fetching
# ---------------------------------------------------------------------------

def scrape_programme_content(
    acadsem: str,
    programme: str,
    session: Optional[requests.Session] = None,
) -> List[Dict[str, object]]:
    """Fetch and parse course content for one programme in one semester."""
    acadsem_content, acad, semester = to_content_acadsem(acadsem)
    payload = [
        ("acadsem", acadsem_content),
        ("r_course_yr", programme),
        ("r_subj_code", "Enter Keywords or Course Code"),
        ("boption", "CLoad"),
        ("acad", acad),
        ("semester", semester),
        ("acadsem", acadsem_content),
    ]
    sess = session or requests.Session()
    print(f"  Scraping content '{programme}' for '{acadsem}'...")
    resp = sess.post(CONTENT_DISPLAY_URL, data=payload, headers=HEADERS)
    resp.raise_for_status()
    courses = parse_content_html(resp.text)
    print(f"    -> {len(courses)} course(s).")
    return courses


# ---------------------------------------------------------------------------
# Full-semester content scraping
# ---------------------------------------------------------------------------

def scrape_content_for_semester(
    acadsem: str,
    max_workers: int = 1,
) -> Dict[str, List[Dict[str, object]]]:
    """Scrape course content for all programmes in the given semester."""
    semesters, programmes = get_acadsem_programme_codes(acadsem=acadsem)
    if acadsem not in semesters:
        raise ValueError(f"Semester '{acadsem}' is not listed on the schedule page.")

    print(f"Scraping content for {len(programmes)} programmes ('{acadsem}')...")
    results: Dict[str, List[Dict[str, object]]] = {}

    if max_workers <= 1:
        for prog in programmes:
            results[prog] = scrape_programme_content(acadsem, prog)
    else:
        def fetch(prog: str) -> Tuple[str, List[Dict[str, object]]]:
            try:
                return prog, scrape_programme_content(acadsem, prog)
            except Exception as exc:
                print(f"  Error scraping content '{prog}': {exc}")
                return prog, []

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(fetch, prog): prog for prog in programmes}
            for future in as_completed(futures):
                prog, courses = future.result()
                results[prog] = courses

    return results


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

def output_path_for(acadsem: str) -> Path:
    return DATA_DIR / f"02b_content_{acadsem.replace(';', '_')}.json"


def write_content(
    acadsem: str,
    content: Dict[str, List[Dict[str, object]]],
    indent: Optional[int] = None,
) -> Path:
    DATA_DIR.mkdir(exist_ok=True)
    path = output_path_for(acadsem)
    with path.open("w", encoding="utf-8") as f:
        json.dump(content, f, indent=indent, ensure_ascii=False)
    print(f"Wrote {path.name}")
    return path


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main(argv: Optional[List[str]] = None) -> None:
    import argparse
    parser = argparse.ArgumentParser(description="Scrape NTU course content for a semester.")
    parser.add_argument("semester", nargs="?", metavar="YYYY;S")
    parser.add_argument("--workers", type=int, default=1, metavar="N")
    parser.add_argument("--pretty", action="store_true")
    args = parser.parse_args(argv)

    indent = 2 if args.pretty else None
    acadsem: Optional[str] = args.semester
    if not acadsem:
        acadsem = choose_semester_interactively()

    if acadsem.lower() == "all":
        semesters, _ = get_acadsem_programme_codes()
        for sem in semesters:
            content = scrape_content_for_semester(sem, max_workers=args.workers)
            write_content(sem, content, indent=indent)
    else:
        content = scrape_content_for_semester(acadsem, max_workers=args.workers)
        write_content(acadsem, content, indent=indent)


if __name__ == "__main__":
    main()
