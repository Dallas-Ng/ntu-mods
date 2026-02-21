"""
2_courses.py
============

This script builds on the functionality provided by
``ntu_class_schedule_scraper.py`` to scrape all available courses for a
specific academic semester.  Given an academic semester code such as
``'2025;2'`` (Academic Year 2025 Semester 2), it iterates over every
programme/major listed on the schedule landing page and fetches the course
details for that programme and semester.  The results are written to a JSON
file in the same directory.

If no semester code is provided on the command line, the script will load
the academic years from ``1_academic_year.json`` and prompt the user to
choose one.  This JSON file is produced by the companion script
``1_academic_year.py`` and contains all available semester codes and
human‑readable names【353616380788415†L83-L123】.

Example usage::

    # Scrape courses for Acad Yr 2025 Semester 2
    python 2_courses.py 2025;2

    # Scrape courses for the first academic year listed in 1_academic_year.json
    python 2_courses.py

The resulting file will be named ``courses_YYYY_S.json`` (e.g.
``courses_2025_2.json``) and will contain a dictionary mapping programme
codes (e.g. ``'CSC;;1;F'``) to lists of course entries.  Empty lists
indicate that no courses were scheduled for that programme in the given
semester.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# The following imports are needed for HTTP requests and HTML parsing.
import re
import requests
from bs4 import BeautifulSoup

###############################################################################
# Helper functions copied from ntu_class_schedule_scraper.py
#
# To make this script completely self‑contained, the key scraping logic from
# ``ntu_class_schedule_scraper.py`` has been reproduced here.  The code below
# defines ``get_acadsem_programme_codes``, ``parse_schedule_html`` and
# ``scrape_programme_schedule``.  These functions perform the HTTP
# requests and HTML parsing necessary to retrieve class schedules from
# NTU's schedule portal.  They have been adapted slightly to send the
# ``acadsem`` parameter twice (as required by the NTU CGI【543245461985408†L138-L149】)
# and to return an empty list instead of raising an exception when no
# courses are found.

def get_acadsem_programme_codes(
    *,
    main_url: str = "https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main",
    session: Optional[requests.Session] = None,
) -> Tuple[List[str], List[str]]:
    """Fetch the list of academic semesters and programme codes from the main schedule page.

    This helper makes a single GET request to the schedule landing page and
    parses the ``<select>`` elements to extract all available semester codes
    (e.g. ``'2025;2'``) and programme codes (e.g. ``'CSC;;1;F'``).  These codes
    can then be fed into :func:`scrape_programme_schedule`.

    Parameters
    ----------
    main_url: str, optional
        URL of the schedule landing page.  Defaults to the production URL.

    session: requests.Session, optional
        Existing session to reuse connections.

    Returns
    -------
    Tuple[List[str], List[str]]
        A two‑element tuple where the first element is a list of semester
        identifiers and the second element is a list of programme codes.

    Raises
    ------
    requests.HTTPError
        If the server returns a non‑OK status.
    """
    sess = session or requests.Session()
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/118.0.0.0 Safari/537.36"
        )
    }
    print(f"Fetching list of semesters and programmes from '{main_url}'...")
    resp = sess.get(main_url, headers=headers)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    # Extract semester codes
    sem_select = soup.find("select", attrs={"name": "acadsem"})
    if not sem_select:
        raise ValueError("Could not find 'acadsem' select element on the page")
    acadsem_values: List[str] = []
    for option in sem_select.find_all("option"):
        val = option.get("value")
        if val:
            acadsem_values.append(val)
    # Extract programme codes (r_course_yr)
    prog_select = soup.find("select", attrs={"name": "r_course_yr"})
    if not prog_select:
        raise ValueError("Could not find 'r_course_yr' select element on the page")
    programme_values: List[str] = []
    for option in prog_select.find_all("option"):
        val = option.get("value")
        # Skip placeholder or category options whose text or value contains '---'.
        # The first entry in the drop‑down has an empty value and displays
        # "---Select an Option---"; some category separators might use a value
        # like "---".  We ignore any option where the value is falsy or where
        # the displayed text contains '---'.  This ensures we only collect
        # actual programme codes.【353616380788415†L130-L135】
        if not val:
            continue
        text = option.get_text(strip=True)
        if '---' in text or '---' in val:
            continue
        programme_values.append(val)
    print(
        f"Found {len(acadsem_values)} semesters and {len(programme_values)} programme codes."
    )
    return acadsem_values, programme_values


def parse_schedule_html(html_text: str) -> List[Dict[str, object]]:
    """Parse the HTML returned by ``AUS_SCHEDULE.main_display1``.

    The NTU schedule output is essentially plain text formatted with ``<br>``
    elements and paragraphs.  Courses are separated by lines consisting of
    three asterisks (``* * *``).  Course details appear in a specific order:

    1. The first line contains the course code, title and credits.  For
       example: ``AAA28R CERAMICS I*~ 3.0 AU``.  Any trailing symbols like
       ``*`` or ``~`` are annotations and are stripped from the title.

    2. Zero or more ``Remark:`` or ``Prerequisite:`` lines follow.

    3. A header line ``INDEX TYPE GROUP DAY TIME VENUE REMARK`` delineates
       the start of the schedule table.

    4. One or more lines list the index number, type, group, day, time,
       venue and any remark.

    A blank line followed by another ``* * *`` separator signals the start
    of the next course.  This parser is robust against extra whitespace.

    Parameters
    ----------
    html_text: str
        Raw HTML from the schedule page.

    Returns
    -------
    List[Dict[str, object]]
        Parsed list of courses.  Returns an empty list if no courses were found.
    """
    soup = BeautifulSoup(html_text, "html.parser")
    # Extract visible text as plain lines for detecting the old "* * *" format.
    text = soup.get_text(separator="\n")
    # If the legacy plain‑text format with "* * *" separators is detected,
    # fall back to the original parsing logic.  Otherwise, parse the
    # newer table‑based format.  This dual logic allows the scraper to
    # handle both versions of the schedule output.
    if "* * *" in text:
        # Normalize whitespace: collapse multiple consecutive newlines and strip
        # leading/trailing whitespace on each line.
        lines = [ln.strip() for ln in text.split("\n")]
        # Remove empty lines
        lines = [ln for ln in lines if ln]
        # Find indices of separators ("* * *") to delineate courses
        separators = [i for i, ln in enumerate(lines) if ln.startswith("* * *")]
        # Determine course boundaries based on separator indices
        course_boundaries: List[Tuple[int, int]] = []
        if separators:
            # Add a virtual separator at the end to simplify iteration
            all_seps = separators + [len(lines)]
            for idx in range(len(separators)):
                start = separators[idx] + 1  # skip the separator itself
                end = all_seps[idx + 1]
                course_boundaries.append((start, end))
        else:
            # No separators found; assume the entire page is one course
            course_boundaries.append((0, len(lines)))
        courses: List[Dict[str, object]] = []
        # Regular expressions to parse the first line
        header_re = re.compile(
            r"^(?P<code>[A-Z]{2,}[0-9A-Z]+)\s+(?P<title>.*?)\s+(?P<credits>[0-9]+\.[0-9])\s+AU$",
            re.IGNORECASE,
        )
        # Compose patterns for schedule table rows.  Some fields may be empty.
        table_line_re = re.compile(
            r"^(?P<index>\d{4,5})\s+"  # index number (4–5 digits)
            r"(?P<type>\w+/\w+|\w+)\s+"  # e.g. LEC/STUDIO or SEM
            r"(?P<group>[^\s]+)\s+"  # group (alphanumeric)
            r"(?P<day>MON|TUE|WED|THU|FRI|SAT|SUN)\s+"
            r"(?P<time>\d{4}-\d{4})\s+"
            r"(?P<venue>[^\s]+)"  # venue (no spaces)
            r"(?:\s+(?P<remark>.*))?$",  # optional remark
        )
        for start, end in course_boundaries:
            section = lines[start:end]
            if not section:
                continue
            # Parse header line
            header_match = header_re.match(section[0])
            if not header_match:
                # Skip sections that don't match the expected pattern
                continue
            course_code = header_match.group("code").strip()
            raw_title = header_match.group("title").strip()
            # Remove trailing symbols like * ~ # from the title
            course_title = re.sub(r"[\*~#]+$", "", raw_title).strip()
            credits = float(header_match.group("credits"))
            # Initialize containers for optional info and schedules
            prerequisite: Optional[str] = None
            remark: Optional[str] = None
            schedules: List[Dict[str, str]] = []
            # Skip the first line and iterate over the rest
            for line in section[1:]:
                # Extract prerequisite and remark lines
                if line.startswith("Prerequisite:"):
                    prerequisite = line.partition(":")[2].strip()
                    continue
                if line.startswith("Remark:"):
                    # There may be multiple remark lines; concatenate them
                    current_remark = line.partition(":")[2].strip()
                    if remark:
                        remark = remark + " " + current_remark
                    else:
                        remark = current_remark
                    continue
                # Detect table header and skip it
                if re.match(r"^INDEX\s+TYPE", line):
                    continue
                # Table rows
                tbl_match = table_line_re.match(line)
                if tbl_match:
                    schedules.append({
                        "index": tbl_match.group("index"),
                        "type": tbl_match.group("type"),
                        "group": tbl_match.group("group"),
                        "day": tbl_match.group("day"),
                        "time": tbl_match.group("time"),
                        "venue": tbl_match.group("venue"),
                        "remark": tbl_match.group("remark") or "",
                    })
                    continue
                # Ignore unrecognized lines (such as blank lines or extraneous notices)
            course_dict: Dict[str, object] = {
                "course_code": course_code,
                "course_title": course_title,
                "credits": credits,
                "prerequisite": prerequisite,
                "remark": remark,
                "schedules": schedules,
            }
            courses.append(course_dict)
        return courses
    # ---------------------------------------------------------------
    # Table‑based format parsing.
    courses: List[Dict[str, object]] = []
    tables = soup.find_all('table')
    i = 0
    while i < len(tables):
        table = tables[i]
        # Identify a course metadata table: no border attribute and at least
        # three columns in the first row, with the last cell containing 'AU'.
        if not table.has_attr('border'):
            first_row = table.find('tr')
            cells = first_row.find_all(['td', 'th']) if first_row else []
            if len(cells) >= 3:
                last_text = cells[-1].get_text(strip=True)
                if 'AU' in last_text:
                    # Extract course code, title, and credits
                    code = cells[0].get_text(strip=True)
                    raw_title = cells[1].get_text(strip=True)
                    # Strip any trailing annotation symbols such as *, ~ or # from the title
                    title = re.sub(r"[\*~#]+$", "", raw_title).strip()
                    # Credits may appear as '.0 AU' or '3.0 AU'; extract the numeric part
                    credit_match = re.search(r'([0-9]*\.?[0-9]+)', last_text)
                    credits = float(credit_match.group(1)) if credit_match else None
                    # Initialize prerequisite and remark strings and a state variable
                    prerequisite: Optional[str] = None
                    remark: Optional[str] = None
                    current_tag: Optional[str] = None
                    # Extract prerequisites and remarks from rows within the metadata
                    # table itself (after the first row).  Some course remarks and
                    # prerequisites are embedded directly in the same table as
                    # the course code and title, and may span multiple rows.  We
                    # use ``current_tag`` to track whether subsequent rows are
                    # continuations of a prerequisite or remark.
                    for rrow in table.find_all('tr')[1:]:
                        # Concatenate all cell texts with spaces; using get_text
                        # ensures that NBSP and nested tags are handled.
                        cell_texts = [c.get_text(" ", strip=True) for c in rrow.find_all(['td','th'])]
                        if not cell_texts:
                            continue
                        first_cell = cell_texts[0] if cell_texts else ''
                        # Detect a new Prerequisite or Remark line
                        if first_cell.startswith('Prerequisite'):
                            current_tag = 'prerequisite'
                            # Extract the part after the colon (if any)
                            parts = first_cell.split(':', 1)
                            # Combine remaining cells into the value, including cells beyond index 0
                            remainder = " ".join([parts[1].strip()] + cell_texts[1:]) if len(parts) == 2 else " ".join(cell_texts[1:])
                            val = remainder.strip()
                            if val:
                                prerequisite = (prerequisite + " " + val) if prerequisite else val
                            continue
                        elif first_cell.startswith('Remark'):
                            current_tag = 'remark'
                            parts = first_cell.split(':', 1)
                            remainder = " ".join([parts[1].strip()] + cell_texts[1:]) if len(parts) == 2 else " ".join(cell_texts[1:])
                            val = remainder.strip()
                            if val:
                                remark = (remark + " " + val) if remark else val
                            continue
                        # Continuation lines: if the first cell is empty (e.g. NBSP) and we
                        # previously encountered a Prerequisite or Remark, append the
                        # additional information to the appropriate field.
                        if (first_cell == '' or first_cell == '\xa0') and current_tag in ('prerequisite', 'remark'):
                            # Use the rest of the cells as the continuation value
                            continuation = " ".join(cell_texts[1:]).strip()
                            if continuation:
                                if current_tag == 'prerequisite':
                                    prerequisite = (prerequisite + " " + continuation) if prerequisite else continuation
                                elif current_tag == 'remark':
                                    remark = (remark + " " + continuation) if remark else continuation
                            continue
                        # If none of the above conditions match, reset current_tag
                        current_tag = None
                    # Advance j to look for remark tables and the schedule table
                    j = i + 1
                    # Gather remarks and prerequisites from subsequent tables
                    while j < len(tables) and not tables[j].has_attr('border'):
                        rtable = tables[j]
                        # Reset tag state for each new remark table
                        local_tag: Optional[str] = None
                        for rrow in rtable.find_all('tr'):
                            cell_texts = [c.get_text(" ", strip=True) for c in rrow.find_all(['td','th'])]
                            if not cell_texts:
                                continue
                            first_cell = cell_texts[0] if cell_texts else ''
                            if first_cell.startswith('Prerequisite'):
                                local_tag = 'prerequisite'
                                parts = first_cell.split(':', 1)
                                remainder = " ".join([parts[1].strip()] + cell_texts[1:]) if len(parts) == 2 else " ".join(cell_texts[1:])
                                val = remainder.strip()
                                if val:
                                    prerequisite = (prerequisite + " " + val) if prerequisite else val
                                continue
                            elif first_cell.startswith('Remark'):
                                local_tag = 'remark'
                                parts = first_cell.split(':', 1)
                                remainder = " ".join([parts[1].strip()] + cell_texts[1:]) if len(parts) == 2 else " ".join(cell_texts[1:])
                                val = remainder.strip()
                                if val:
                                    remark = (remark + " " + val) if remark else val
                                continue
                            # Continuation lines for prerequisite or remark
                            if (first_cell == '' or first_cell == '\xa0') and local_tag in ('prerequisite', 'remark'):
                                continuation = " ".join(cell_texts[1:]).strip()
                                if continuation:
                                    if local_tag == 'prerequisite':
                                        prerequisite = (prerequisite + " " + continuation) if prerequisite else continuation
                                    elif local_tag == 'remark':
                                        remark = (remark + " " + continuation) if remark else continuation
                                continue
                            # Reset tag if row does not continue
                            local_tag = None
                        j += 1
                    # The schedule table is the next table with a 'border' attribute
                    schedule_table = None
                    if j < len(tables) and tables[j].has_attr('border'):
                        schedule_table = tables[j]
                    schedules: List[Dict[str, str]] = []
                    if schedule_table:
                        s_rows = schedule_table.find_all('tr')
                        # The first row is the header; skip it
                        for srow in s_rows[1:]:
                            cols = [c.get_text(strip=True) for c in srow.find_all(['td', 'th'])]
                            if not cols:
                                continue
                            # Some schedule tables may omit certain fields (represented by blank strings)
                            index = cols[0] if len(cols) > 0 else ''
                            _type = cols[1] if len(cols) > 1 else ''
                            group = cols[2] if len(cols) > 2 else ''
                            day = cols[3] if len(cols) > 3 else ''
                            time_field = cols[4] if len(cols) > 4 else ''
                            venue = cols[5] if len(cols) > 5 else ''
                            rem = cols[6] if len(cols) > 6 else ''
                            schedules.append({
                                "index": index,
                                "type": _type,
                                "group": group,
                                "day": day,
                                "time": time_field,
                                "venue": venue,
                                "remark": rem,
                            })
                    course_dict: Dict[str, object] = {
                        "course_code": code,
                        "course_title": title,
                        "credits": credits,
                        "prerequisite": prerequisite,
                        "remark": remark,
                        "schedules": schedules,
                    }
                    courses.append(course_dict)
                    # Skip to the table after the schedule table
                    i = j + 1
                    continue
        # Not a metadata table; move to the next table
        i += 1
    return courses


def scrape_programme_schedule(
    acadsem: str,
    programme: str,
    *,
    base_url: str = "https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display1",
    session: Optional[requests.Session] = None,
) -> List[Dict[str, object]]:
    """Retrieve and parse the class schedule for a given academic semester and programme.

    Parameters
    ----------
    acadsem: str
        Academic semester identifier in the form ``YYYY;S`` (e.g. ``'2025;2'``).

    programme: str
        Programme/Year code (value of the ``r_course_yr`` form field).  For
        example ``'CSC;;1;F'`` corresponds to Computer Science Year 1.

    base_url: str, optional
        The URL of the schedule CGI script.  It rarely changes but is exposed
        as an argument for flexibility or testing.

    session: requests.Session, optional
        Existing ``Session`` object to reuse TCP connections and cookies.

    Returns
    -------
    List[Dict[str, object]]
        A list of course dictionaries.  Each dictionary contains keys
        ``course_code``, ``course_title``, ``credits``, ``prerequisite``,
        ``remark`` and ``schedules``.  ``schedules`` is itself a list of
        dictionaries describing individual index numbers.

    Raises
    ------
    requests.HTTPError
        If the server returns an HTTP error status.
    """
    # Build the form data as a list of tuples instead of a dict to
    # preserve order and allow duplicate keys.  NTU's CGI expects the
    # ``acadsem`` parameter to appear twice (one for the visible select
    # element and one for the hidden field) as seen in the original
    # form submission【543245461985408†L138-L149】.
    payload = [
        ("acadsem", acadsem),
        ("r_course_yr", programme),
        ("r_subj_code", "Enter Keywords or Course Code"),
        ("r_search_type", "F"),
        ("boption", "CLoad"),
        ("acadsem", acadsem),  # duplicate acadsem
        ("staff_access", "false"),
    ]

    sess = session or requests.Session()
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/118.0.0.0 Safari/537.36"
        ),
        "Origin": "https://wish.wis.ntu.edu.sg",
        "Referer": "https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main",
    }
    # Inform the user which programme/semester is being scraped
    print(
        f"Requesting schedule for programme '{programme}' in semester '{acadsem}'..."
    )
    response = sess.post(base_url, data=payload, headers=headers)
    response.raise_for_status()
    html_text = response.text
    courses = parse_schedule_html(html_text)
    if courses:
        print(
            f"Retrieved {len(courses)} course{'s' if len(courses) != 1 else ''} "
            f"for programme '{programme}' in semester '{acadsem}'."
        )
    else:
        print(
            f"No courses found for programme '{programme}' in semester '{acadsem}'."
        )
    return courses



def choose_acadsem_from_json(json_path: Path) -> str:
    """Load academic semesters from a JSON file and prompt the user to pick one.

    Parameters
    ----------
    json_path: Path
        Path to the JSON file containing academic semesters (output of
        ``1_academic_year.py``).

    Returns
    -------
    str
        The selected academic semester code.

    Raises
    ------
    ValueError
        If the file cannot be read or contains no semesters.
    """
    with json_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not data:
        raise ValueError(f"No academic semesters found in {json_path}")
    print("Available academic semesters:")
    # Display an option to scrape all semesters at index 0
    print("  0. All semesters (scrape everything)")
    for idx, entry in enumerate(data, start=1):
        print(f"  {idx}. {entry['name']} ({entry['code']})")
    prompt = f"Enter the number of the semester to scrape [0-{len(data)}]: "
    while True:
        choice = input(prompt)
        try:
            selection = int(choice)
            # Option 0 means scrape all
            if selection == 0:
                return "all"
            if 1 <= selection <= len(data):
                return data[selection - 1]["code"]
        except (ValueError, TypeError):
            pass
        print("Invalid selection. Please try again.")


def scrape_courses_for_semester(acadsem: str) -> Dict[str, List[Dict[str, object]]]:
    """Scrape all courses for the given academic semester.

    Parameters
    ----------
    acadsem: str
        Academic semester code (e.g. ``'2025;2'``).

    Returns
    -------
    dict
        Mapping of programme codes to lists of course dictionaries.  Each
        course dictionary is produced by
        :func:`ntu_class_schedule_scraper.scrape_programme_schedule`.

    Notes
    -----
    This function will print progress messages as it iterates through the
    programmes.  Programmes that return no courses will have an empty
    list.
    """
    semesters, programmes = get_acadsem_programme_codes()
    if acadsem not in semesters:
        raise ValueError(
            f"Academic semester '{acadsem}' is not available on the schedule page."
        )
    results: Dict[str, List[Dict[str, object]]] = {}
    print(f"Scraping courses for semester {acadsem}...")
    for prog in programmes:
        courses = scrape_programme_schedule(acadsem, prog)
        results[prog] = courses
    return results


def main(argv: Optional[List[str]] = None) -> None:
    """Main entry point for the script."""
    argv = argv or sys.argv[1:]
    acadsem: Optional[str] = None
    if argv:
        acadsem = argv[0]
    if not acadsem:
        # Determine path to 1_academic_year.json relative to this script
        default_json = Path(__file__).with_name("1_academic_year.json")
        if default_json.exists():
            acadsem = choose_acadsem_from_json(default_json)
        else:
            raise FileNotFoundError(
                "No academic semester provided and '1_academic_year.json' was not found."
            )
    # If the user selected "all", scrape every available semester
    if acadsem and acadsem.lower() == "all":
        # Fetch all available semesters once
        semesters, _ = get_acadsem_programme_codes()
        all_results: Dict[str, Dict[str, List[Dict[str, object]]]] = {}
        for sem in semesters:
            print(f"Scraping all programmes for semester {sem}...")
            all_results[sem] = scrape_courses_for_semester(sem)
        courses = all_results
        # Use a generic filename
        output_name = "courses_all.json"
    else:
        # Scrape a single semester
        courses = scrape_courses_for_semester(acadsem)
        output_name = f"courses_{acadsem.replace(';', '_')}.json"
    # Write output JSON file
    output_path = Path(__file__).with_name(output_name)
    with output_path.open("w", encoding="utf-8") as f:
        # json.dump(courses, f, indent=2, ensure_ascii=False)
        json.dump(courses, f, indent=None, ensure_ascii=False, separators=(',', ':'))
    print(f"Wrote course data to {output_path}")


if __name__ == "__main__":
    main()