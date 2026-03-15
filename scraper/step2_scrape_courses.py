"""
step2_scrape_courses.py
=======================

Scrapes all course details for a specific academic semester across all
programmes listed on the NTU schedule portal.

Given a semester code such as ``'2025;2'`` (Academic Year 2025 Semester 2),
this script iterates over every programme and fetches the course details.
Results are written to ``data/02_courses_{YYYY}_{S}.json``.

If no semester code is provided on the command line, the script loads
the available semesters from ``data/01_semesters.json`` (produced by
step1_fetch_semesters.py) and prompts the user to choose one.

Usage:
    python step2_scrape_courses.py 2025;2
    python step2_scrape_courses.py 2025;2 --workers 4
    python step2_scrape_courses.py          # interactive semester selection
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

DATA_DIR = Path(__file__).parent / "data"
SEMESTERS_PATH = DATA_DIR / "01_semesters.json"

SCHEDULE_MAIN_URL = "https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main"
SCHEDULE_DISPLAY_URL = "https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display1"
SCHEDULE_PROGRAMME_URL = "https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/118.0.0.0 Safari/537.36"
    ),
    "Origin": "https://wish.wis.ntu.edu.sg",
    "Referer": "https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main",
}


# ---------------------------------------------------------------------------
# Fetching available semesters and programmes
# ---------------------------------------------------------------------------

def get_acadsem_programme_codes(
    session: Optional[requests.Session] = None,
    acadsem: Optional[str] = None,
) -> Tuple[List[str], List[str]]:
    """Fetch semester and programme codes from the NTU schedule portal.

    The portal's main page only returns the programme list for whichever
    semester is currently selected by default (often Special Term, with a
    small subset of programmes).  To get the full programme list for a given
    semester, we must POST to ``SCHEDULE_PROGRAMME_URL`` with that semester —
    which is what the browser does when the user changes the semester dropdown.

    Parameters
    ----------
    acadsem:
        Semester code to fetch programmes for (e.g. ``'2025;2'``).  When
        omitted the function falls back to the default-selected semester on
        the main page, which may be incomplete.

    Returns
    -------
    tuple of (list[str], list[str])
        Semester codes (e.g. ``['2025;2', '2025;1', ...]``) and programme
        codes (e.g. ``['CSC;;1;F', ...]``).
    """
    sess = session or requests.Session()
    print(f"Fetching semesters from '{SCHEDULE_MAIN_URL}'...")
    resp = sess.get(SCHEDULE_MAIN_URL, headers=HEADERS)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    sem_select = soup.find("select", attrs={"name": "acadsem"})
    if not sem_select:
        raise ValueError("Could not find 'acadsem' select element on the page.")
    acadsem_values: List[str] = [
        opt.get("value")
        for opt in sem_select.find_all("option")
        if opt.get("value")
    ]

    # If a specific semester was requested, POST to the programme-list endpoint
    # to get the complete programme list for that semester.  Without this, the
    # page only returns programmes for whichever semester is currently selected
    # by default (typically Special Term with a small subset).
    target_sem = acadsem or (acadsem_values[0] if acadsem_values else None)
    if target_sem:
        print(f"Fetching programme list for semester '{target_sem}'...")
        prog_resp = sess.post(
            SCHEDULE_PROGRAMME_URL,
            data={"acadsem": target_sem, "boption": "x", "staff_access": "false"},
            headers=HEADERS,
        )
        prog_resp.raise_for_status()
        prog_soup = BeautifulSoup(prog_resp.text, "html.parser")
    else:
        prog_soup = soup

    prog_select = prog_soup.find("select", attrs={"name": "r_course_yr"})
    if not prog_select:
        raise ValueError("Could not find 'r_course_yr' select element on the page.")
    programme_values: List[str] = []
    for option in prog_select.find_all("option"):
        val = option.get("value")
        if not val:
            continue
        text = option.get_text(strip=True)
        if "---" in text or "---" in val:
            continue
        programme_values.append(val)

    print(f"Found {len(acadsem_values)} semesters and {len(programme_values)} programmes.")
    return acadsem_values, programme_values


# ---------------------------------------------------------------------------
# HTML parsing
# ---------------------------------------------------------------------------

def parse_schedule_html(html_text: str) -> List[Dict[str, object]]:
    """Parse the HTML returned by AUS_SCHEDULE.main_display1.

    Handles two formats emitted by the NTU portal:
    - Legacy plain-text format, where courses are separated by ``* * *`` lines.
    - Newer table-based format using HTML ``<table>`` elements.

    Returns
    -------
    list of dict
        Each dict has keys: ``course_code``, ``course_title``, ``credits``,
        ``prerequisite``, ``remark``, ``schedules``.
    """
    soup = BeautifulSoup(html_text, "html.parser")
    text = soup.get_text(separator="\n")

    if "* * *" in text:
        return _parse_legacy_format(text)
    return _parse_table_format(soup)


def _parse_legacy_format(text: str) -> List[Dict[str, object]]:
    """Parse the legacy ``* * *``-delimited plain-text schedule format."""
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    separators = [i for i, ln in enumerate(lines) if ln.startswith("* * *")]

    if separators:
        all_seps = separators + [len(lines)]
        boundaries = [
            (separators[i] + 1, all_seps[i + 1])
            for i in range(len(separators))
        ]
    else:
        boundaries = [(0, len(lines))]

    header_re = re.compile(
        r"^(?P<code>[A-Z]{2,}[0-9A-Z]+)\s+(?P<title>.*?)\s+(?P<credits>[0-9]+\.[0-9])\s+AU$",
        re.IGNORECASE,
    )
    table_line_re = re.compile(
        r"^(?P<index>\d{4,5})\s+"
        r"(?P<type>\w+/\w+|\w+)\s+"
        r"(?P<group>[^\s]+)\s+"
        r"(?P<day>MON|TUE|WED|THU|FRI|SAT|SUN)\s+"
        r"(?P<time>\d{4}-\d{4})\s+"
        r"(?P<venue>[^\s]+)"
        r"(?:\s+(?P<remark>.*))?$",
    )

    courses: List[Dict[str, object]] = []
    for start, end in boundaries:
        section = lines[start:end]
        if not section:
            continue
        m = header_re.match(section[0])
        if not m:
            continue

        course_code = m.group("code").strip()
        course_title = re.sub(r"[\*~#]+$", "", m.group("title").strip()).strip()
        credits = float(m.group("credits"))
        fields: Dict[str, str] = {}
        schedules: List[Dict[str, str]] = []

        for line in section[1:]:
            if re.match(r"^INDEX\s+TYPE", line):
                continue
            tbl_m = table_line_re.match(line)
            if tbl_m:
                schedules.append({
                    "index": tbl_m.group("index"),
                    "type": tbl_m.group("type"),
                    "group": tbl_m.group("group"),
                    "day": tbl_m.group("day"),
                    "time": tbl_m.group("time"),
                    "venue": tbl_m.group("venue"),
                    "remark": tbl_m.group("remark") or "",
                })
            elif ":" in line:
                label, _, value = line.partition(":")
                label = label.strip()
                value = value.strip()
                if label and value:
                    fields[label] = (
                        (fields[label] + " " + value).strip()
                        if label in fields
                        else value
                    )

        courses.append({
            "course_code": course_code,
            "course_title": course_title,
            "credits": credits,
            "fields": fields,
            "schedules": schedules,
        })
    return courses


def _parse_table_format(soup: BeautifulSoup) -> List[Dict[str, object]]:
    """Parse the newer HTML table-based schedule format."""
    courses: List[Dict[str, object]] = []
    tables = soup.find_all("table")
    i = 0
    while i < len(tables):
        table = tables[i]
        # A course metadata table has no 'border' attribute and its first row
        # ends with a cell containing 'AU'.
        if not table.has_attr("border"):
            first_row = table.find("tr")
            cells = first_row.find_all(["td", "th"]) if first_row else []
            if len(cells) >= 3 and "AU" in cells[-1].get_text(strip=True):
                code = cells[0].get_text(strip=True)
                raw_title = cells[1].get_text(strip=True)
                title = re.sub(r"[\*~#]+$", "", raw_title).strip()
                credit_m = re.search(r"([0-9]*\.?[0-9]+)", cells[-1].get_text(strip=True))
                credits = float(credit_m.group(1)) if credit_m else None

                fields: Dict[str, str] = {}
                current_tag: Optional[str] = None

                # Parse all labeled rows within the metadata table
                for rrow in table.find_all("tr")[1:]:
                    cell_texts = [c.get_text(" ", strip=True) for c in rrow.find_all(["td", "th"])]
                    if not cell_texts:
                        continue
                    first_cell = cell_texts[0]
                    fields, current_tag = _extract_fields(
                        first_cell, cell_texts, fields, current_tag
                    )

                # Collect additional fields from subsequent non-border tables
                j = i + 1
                while j < len(tables) and not tables[j].has_attr("border"):
                    local_tag: Optional[str] = None
                    for rrow in tables[j].find_all("tr"):
                        cell_texts = [c.get_text(" ", strip=True) for c in rrow.find_all(["td", "th"])]
                        if not cell_texts:
                            continue
                        first_cell = cell_texts[0]
                        fields, local_tag = _extract_fields(
                            first_cell, cell_texts, fields, local_tag
                        )
                    # Also capture any plain <p> text as description
                    for ptag in tables[j].find_all("p"):
                        text = ptag.get_text(" ", strip=True)
                        if text:
                            existing = fields.get("description", "")
                            fields["description"] = (existing + " " + text).strip() if existing else text
                    j += 1

                # The schedule table is the next table with a 'border' attribute
                schedules: List[Dict[str, str]] = []
                last_index = ""
                if j < len(tables) and tables[j].has_attr("border"):
                    for srow in tables[j].find_all("tr")[1:]:
                        cols = [c.get_text(strip=True) for c in srow.find_all(["td", "th"])]
                        if not cols:
                            continue
                        index = cols[0] if len(cols) > 0 else ""
                        if index:
                            last_index = index
                        else:
                            index = last_index
                        schedules.append({
                            "index": index,
                            "type": cols[1] if len(cols) > 1 else "",
                            "group": cols[2] if len(cols) > 2 else "",
                            "day": cols[3] if len(cols) > 3 else "",
                            "time": cols[4] if len(cols) > 4 else "",
                            "venue": cols[5] if len(cols) > 5 else "",
                            "remark": cols[6] if len(cols) > 6 else "",
                        })

                courses.append({
                    "course_code": code,
                    "course_title": title,
                    "credits": credits,
                    "fields": fields,
                    "schedules": schedules,
                })
                i = j + 1
                continue
        i += 1
    return courses


def _extract_fields(
    first_cell: str,
    cell_texts: List[str],
    fields: Dict[str, str],
    current_tag: Optional[str],
) -> Tuple[Dict[str, str], Optional[str]]:
    """Capture ALL labeled table rows into a fields dict generically.

    Any row whose first cell ends with a colon is treated as a label/value
    pair.  Rows whose first cell is empty or a non-breaking space are treated
    as continuations of the previous label.  Everything else resets the
    current tag so stray rows don't bleed into the wrong field.
    """
    if first_cell in ("", "\xa0"):
        # Continuation of the previous labeled row
        if current_tag:
            continuation = " ".join(cell_texts[1:]).strip()
            if continuation:
                fields[current_tag] = (
                    (fields[current_tag] + " " + continuation).strip()
                    if current_tag in fields
                    else continuation
                )
    elif ":" in first_cell:
        # Labeled row: e.g. "Grade Type:", "Mutually Exclusive with:", …
        label = first_cell.split(":", 1)[0].strip()
        remainder_parts = [first_cell.split(":", 1)[1].strip()] + cell_texts[1:]
        remainder = " ".join(p for p in remainder_parts if p).strip()
        current_tag = label
        if remainder:
            fields[label] = (
                (fields[label] + " " + remainder).strip()
                if label in fields
                else remainder
            )
    else:
        current_tag = None
    return fields, current_tag


# ---------------------------------------------------------------------------
# Programme schedule fetching
# ---------------------------------------------------------------------------

def scrape_programme_schedule(
    acadsem: str,
    programme: str,
    session: Optional[requests.Session] = None,
) -> List[Dict[str, object]]:
    """Fetch and parse the class schedule for one programme in one semester.

    Parameters
    ----------
    acadsem:
        Semester code, e.g. ``'2025;2'``.
    programme:
        Programme code, e.g. ``'CSC;;1;F'``.
    session:
        Optional ``requests.Session`` for connection reuse.
    """
    # NTU's CGI requires acadsem to appear twice in the POST body.
    payload = [
        ("acadsem", acadsem),
        ("r_course_yr", programme),
        ("r_subj_code", "Enter Keywords or Course Code"),
        ("r_search_type", "F"),
        ("boption", "CLoad"),
        ("acadsem", acadsem),
        ("staff_access", "false"),
    ]
    sess = session or requests.Session()
    print(f"  Scraping programme '{programme}' for semester '{acadsem}'...")
    resp = sess.post(SCHEDULE_DISPLAY_URL, data=payload, headers=HEADERS)
    resp.raise_for_status()
    courses = parse_schedule_html(resp.text)
    print(f"    -> {len(courses)} course(s) found.")
    return courses


# ---------------------------------------------------------------------------
# Semester scraping (sequential or parallel)
# ---------------------------------------------------------------------------

def scrape_courses_for_semester(
    acadsem: str,
    max_workers: int = 1,
) -> Dict[str, List[Dict[str, object]]]:
    """Scrape all courses for the given academic semester.

    Parameters
    ----------
    acadsem:
        Semester code, e.g. ``'2025;2'``.
    max_workers:
        Number of threads for parallel scraping. ``1`` means sequential.
    """
    semesters, programmes = get_acadsem_programme_codes(acadsem=acadsem)
    if acadsem not in semesters:
        raise ValueError(f"Semester '{acadsem}' is not listed on the schedule page.")

    print(f"Scraping {len(programmes)} programmes for semester '{acadsem}'...")
    results: Dict[str, List[Dict[str, object]]] = {}

    if max_workers <= 1:
        for prog in programmes:
            results[prog] = scrape_programme_schedule(acadsem, prog)
    else:
        def fetch(prog: str) -> Tuple[str, List[Dict[str, object]]]:
            try:
                return prog, scrape_programme_schedule(acadsem, prog)
            except Exception as exc:
                print(f"  Error scraping '{prog}': {exc}")
                return prog, []

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(fetch, prog): prog for prog in programmes}
            for future in as_completed(futures):
                prog, courses = future.result()
                results[prog] = courses

    return results


# ---------------------------------------------------------------------------
# Interactive semester selection
# ---------------------------------------------------------------------------

def choose_semester_interactively() -> str:
    """Load semesters from data/01_semesters.json and prompt the user to pick one.

    Returns ``'all'`` if the user selects option 0.
    """
    if not SEMESTERS_PATH.exists():
        raise FileNotFoundError(
            f"'{SEMESTERS_PATH}' not found. Run step1_fetch_semesters.py first."
        )
    with SEMESTERS_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not data:
        raise ValueError(f"No semesters found in {SEMESTERS_PATH}.")

    print("Available academic semesters:")
    print("  0. All semesters")
    for idx, entry in enumerate(data, start=1):
        print(f"  {idx}. {entry['name']} ({entry['code']})")

    while True:
        raw = input(f"Select a semester [0-{len(data)}]: ")
        try:
            choice = int(raw)
            if choice == 0:
                return "all"
            if 1 <= choice <= len(data):
                return data[choice - 1]["code"]
        except (ValueError, TypeError):
            pass
        print("Invalid selection. Please try again.")


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

def output_path_for(acadsem: str) -> Path:
    """Return the data/ path for a given semester code."""
    return DATA_DIR / f"02_courses_{acadsem.replace(';', '_')}.json"


def write_courses(acadsem: str, courses: Dict[str, List[Dict[str, object]]], indent: Optional[int] = None) -> Path:
    DATA_DIR.mkdir(exist_ok=True)
    path = output_path_for(acadsem)
    with path.open("w", encoding="utf-8") as f:
        json.dump(courses, f, indent=indent, ensure_ascii=False)
    print(f"Wrote {path.name}")
    return path


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main(argv: Optional[List[str]] = None) -> None:
    import argparse
    parser = argparse.ArgumentParser(description="Scrape NTU course schedules for a semester.")
    parser.add_argument("semester", nargs="?", metavar="YYYY;S",
                        help="Semester code (e.g. '2025;2'). Prompts interactively if omitted.")
    parser.add_argument("--workers", type=int, default=1, metavar="N",
                        help="Number of parallel workers (default: 1).")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON output.")
    args = parser.parse_args(argv)

    indent = 2 if args.pretty else None
    acadsem: Optional[str] = args.semester

    if not acadsem:
        acadsem = choose_semester_interactively()

    if acadsem.lower() == "all":
        semesters, _ = get_acadsem_programme_codes()
        for sem in semesters:
            courses = scrape_courses_for_semester(sem, max_workers=args.workers)
            write_courses(sem, courses, indent=indent)
    else:
        courses = scrape_courses_for_semester(acadsem, max_workers=args.workers)
        write_courses(acadsem, courses, indent=indent)


if __name__ == "__main__":
    main()
