"""
portal.py
=========

Everything that talks to NTU. Three portals:

- schedule portal (wish.wis.ntu.edu.sg/.../aus_schedule.*): semester list,
  programme list, per-programme class schedules
- content portal (wis.ntu.edu.sg/.../AUS_SUBJ_CONT.*): per-programme course
  descriptions, grade type, restriction fields
- exam portal (wis.ntu.edu.sg/.../exam_timetable_und.*): the released exam
  timetable, including the per-semester ``p_plan_no`` it is filed under

HTTP goes through one ``requests.Session`` per thread with keep-alive, a
timeout and retries on 5xx — the schedule scrape is ~700 programmes x 2
portals, so connection reuse is most of the speed.
"""

from __future__ import annotations

import re
import threading
from concurrent.futures import ThreadPoolExecutor

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

SCHEDULE_MAIN_URL = "https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main"
SCHEDULE_PROGRAMMES_URL = "https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display"
SCHEDULE_DISPLAY_URL = "https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display1"
CONTENT_DISPLAY_URL = "https://wis.ntu.edu.sg/webexe/owa/AUS_SUBJ_CONT.main_display1"
EXAM_MAIN_URL = "https://wis.ntu.edu.sg/webexe/owa/exam_timetable_und.main"
EXAM_PLANS_URL = "https://wis.ntu.edu.sg/webexe/owa/exam_timetable_und.MainSubmit"
EXAM_DETAIL_URL = "https://wis.ntu.edu.sg/webexe/owa/exam_timetable_und.Get_detail"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
    ),
    "Origin": "https://wish.wis.ntu.edu.sg",
    "Referer": SCHEDULE_MAIN_URL,
}
TIMEOUT = 90

_local = threading.local()


def _session() -> requests.Session:
    """Per-thread session: keep-alive + retry on transient server errors."""
    s = getattr(_local, "session", None)
    if s is None:
        s = requests.Session()
        s.headers.update(HEADERS)
        retry = Retry(total=3, backoff_factor=2, status_forcelist=(500, 502, 503, 504),
                      allowed_methods=("GET", "POST"))
        s.mount("https://", HTTPAdapter(max_retries=retry, pool_maxsize=4))
        _local.session = s
    return s


def _fetch(url: str, data=None, referer: str | None = None) -> str:
    """GET when ``data`` is None, else POST."""
    headers = {"Referer": referer} if referer else None
    r = _session().request("POST" if data is not None else "GET", url, data=data, headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    return r.text


def _select_values(html: str, name: str) -> list[tuple[str, str]]:
    """(value, label) of every non-empty option in ``<select name=...>``."""
    select = BeautifulSoup(html, "html.parser").find("select", attrs={"name": name})
    if not select:
        raise ValueError(f"Portal page has no '{name}' dropdown — layout changed or error page.")
    return [(o["value"], o.get_text(strip=True)) for o in select.find_all("option") if o.get("value")]


# ---------------------------------------------------------------------------
# Schedule portal
# ---------------------------------------------------------------------------

def fetch_semesters() -> list[dict[str, str]]:
    """``[{"code": "2026;1", "name": "Acad Yr 2026 Semester 1"}, ...]``, newest first."""
    return [{"code": v, "name": n} for v, n in _select_values(_fetch(SCHEDULE_MAIN_URL), "acadsem")]


def fetch_programmes(acadsem: str) -> list[str]:
    """Programme codes (``'CSC;;1;F'``) offered in ``acadsem``.

    Must POST with the semester: the landing page only lists programmes for
    whichever semester it happens to default to (often a tiny Special Term).
    """
    html = _fetch(SCHEDULE_PROGRAMMES_URL, {"acadsem": acadsem, "boption": "x", "staff_access": "false"})
    return [v for v, label in _select_values(html, "r_course_yr") if "---" not in v and "---" not in label]


def fetch_schedule(acadsem: str, programme: str) -> list[dict]:
    """Class schedule for one programme in one semester."""
    payload = [  # NTU's CGI wants acadsem twice.
        ("acadsem", acadsem), ("r_course_yr", programme),
        ("r_subj_code", "Enter Keywords or Course Code"), ("r_search_type", "F"),
        ("boption", "CLoad"), ("acadsem", acadsem), ("staff_access", "false"),
    ]
    return parse_schedule_html(_fetch(SCHEDULE_DISPLAY_URL, payload))


def fetch_content(acadsem: str, programme: str) -> list[dict]:
    """Course content (description, grade type, restrictions) for one programme."""
    year, sem = acadsem.split(";", 1)
    payload = [
        ("acadsem", f"{year}_{sem}"), ("r_course_yr", programme),
        ("r_subj_code", "Enter Keywords or Course Code"), ("boption", "CLoad"),
        ("acad", year), ("semester", sem), ("acadsem", f"{year}_{sem}"),
    ]
    return parse_content_html(_fetch(CONTENT_DISPLAY_URL, payload))


def scrape_semester(acadsem: str, workers: int = 4) -> tuple[dict, dict]:
    """Scrape schedule + content for every programme, in one thread pool.

    Returns ``(courses, content)``, each ``{programme: [course, ...]}``. Any
    programme that still fails after retries aborts the whole scrape — partial
    output is worse than none, because a load replaces the semester.
    """
    if acadsem not in {s["code"] for s in fetch_semesters()}:
        raise ValueError(f"Semester '{acadsem}' is not listed on the schedule portal.")
    programmes = fetch_programmes(acadsem)
    print(f"  {len(programmes)} programmes in {acadsem}")

    jobs = [(fetch_schedule, p) for p in programmes] + [(fetch_content, p) for p in programmes]
    done = 0
    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        futures = [(fn, p, pool.submit(fn, acadsem, p)) for fn, p in jobs]
        results = {fetch_schedule: {}, fetch_content: {}}
        for fn, p, fut in futures:
            results[fn][p] = fut.result()
            done += 1
            if done % 100 == 0 or done == len(jobs):
                print(f"  {done}/{len(jobs)} requests done")
    return results[fetch_schedule], results[fetch_content]


_TITLE_JUNK = re.compile(r"[\*~#]+$")


def parse_schedule_html(html: str) -> list[dict]:
    """Parse AUS_SCHEDULE.main_display1: alternating metadata tables (no
    ``border``) and schedule tables (``border``)."""
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")
    courses: list[dict] = []
    i = 0
    while i < len(tables):
        table = tables[i]
        first_row = table.find("tr")
        cells = first_row.find_all(["td", "th"]) if first_row else []
        is_header = (
            not table.has_attr("border") and len(cells) >= 3
            and "AU" in cells[-1].get_text(strip=True)
        )
        if not is_header:
            i += 1
            continue

        credit_m = re.search(r"([0-9]*\.?[0-9]+)", cells[-1].get_text(strip=True))
        fields: dict[str, str] = {}
        tag = None
        for row in table.find_all("tr")[1:]:
            tag = _extract_fields(row, fields, tag)

        # Following non-border tables carry more labelled rows / description.
        j = i + 1
        while j < len(tables) and not tables[j].has_attr("border"):
            tag = None
            for row in tables[j].find_all("tr"):
                tag = _extract_fields(row, fields, tag)
            for p in tables[j].find_all("p"):
                if text := p.get_text(" ", strip=True):
                    fields["description"] = f"{fields['description']} {text}".strip() if "description" in fields else text
            j += 1

        schedules: list[dict] = []
        last_index = ""
        if j < len(tables) and tables[j].has_attr("border"):
            for srow in tables[j].find_all("tr")[1:]:
                cols = [c.get_text(strip=True) for c in srow.find_all(["td", "th"])]
                if not cols:
                    continue
                cols += [""] * (7 - len(cols))
                last_index = cols[0] or last_index
                schedules.append({
                    "index": last_index, "type": cols[1], "group": cols[2], "day": cols[3],
                    "time": cols[4], "venue": cols[5], "remark": cols[6],
                })

        courses.append({
            "course_code": cells[0].get_text(strip=True),
            "course_title": _TITLE_JUNK.sub("", cells[1].get_text(strip=True)).strip(),
            "credits": float(credit_m.group(1)) if credit_m else None,
            "fields": fields,
            "schedules": schedules,
        })
        i = j + 1
    return courses


def _extract_fields(row, fields: dict[str, str], tag: str | None) -> str | None:
    """Fold one ``Label: value`` table row into ``fields``; returns the label
    that a following blank-labelled row would continue."""
    texts = [c.get_text(" ", strip=True) for c in row.find_all(["td", "th"])]
    if not texts:
        return tag
    first = texts[0]
    if first in ("", "\xa0"):
        if tag and (cont := " ".join(texts[1:]).strip()):
            fields[tag] = f"{fields[tag]} {cont}".strip() if tag in fields else cont
        return tag
    if ":" not in first:
        return None
    label, _, rest = first.partition(":")
    label = label.strip()
    value = " ".join(p for p in [rest.strip(), *texts[1:]] if p).strip()
    if value:
        fields[label] = f"{fields[label]} {value}".strip() if label in fields else value
    return label


def parse_content_html(html: str) -> list[dict]:
    """Parse AUS_SUBJ_CONT.main_display1: one table per course, with a
    ``code | title | AU`` header row, ``Label: | value`` rows, bold single-cell
    "Not offered as ..." flags and a plain single-cell description."""
    courses: list[dict] = []
    for table in BeautifulSoup(html, "html.parser").find_all("table"):
        rows = table.find_all("tr")
        if not rows:
            continue
        head = rows[0].find_all(["td", "th"])
        if len(head) < 3 or "AU" not in head[-1].get_text(strip=True):
            continue
        code = head[0].get_text(strip=True)
        if not code:
            continue

        fields: dict[str, str] = {}
        description = None
        tag = None
        for row in rows[1:]:
            cells = row.find_all(["td", "th"])
            if not cells:
                continue
            first = cells[0]
            if first.get("colspan") in ("2", "3") or len(cells) == 1:
                text = first.get_text(" ", strip=True)
                if text and first.find("b"):
                    fields[text] = "true"
                elif text:
                    description = text
                tag = None
                continue
            label_raw = first.get_text(strip=True)
            rest = " ".join(c.get_text(" ", strip=True) for c in cells[1:]).strip()
            if not label_raw and tag:
                if rest:
                    fields[tag] = f"{fields[tag]} {rest}".strip()
                continue
            if len(cells) < 2 or not label_raw.endswith(":"):
                tag = None
                continue
            tag = label_raw.rstrip(":").strip()
            if rest:
                fields[tag] = f"{fields[tag]} {rest}".strip() if tag in fields else rest

        courses.append({
            "course_code": code,
            "course_title": _TITLE_JUNK.sub("", head[1].get_text(strip=True)).strip(),
            "fields": fields,
            "description": description,
        })
    return courses


# ---------------------------------------------------------------------------
# Exam portal
# ---------------------------------------------------------------------------

_EXAM_ROW = re.compile(r"<tr[^>]*bgcolor=#[0-9A-Fa-f]+>(.*?)</tr>", re.S)
_EXAM_CELL = re.compile(r"<td[^>]*>\s*(.*?)\s*</td>", re.S)
_PLAN_RADIO = re.compile(r'name="p_plan_no"\s+value="(\d+)"\s*/?>\s*([^<]+)', re.S)


def fetch_exam_plans() -> dict[str, int]:
    """``{"AY2026-27 SEM 1": 115, ...}`` — the timetables the portal has released."""
    html = _fetch(EXAM_PLANS_URL, {"p_opt": "1", "p_type": "UE", "bOption": "Next"}, referer=EXAM_MAIN_URL)
    return {label.strip(): int(no) for no, label in _PLAN_RADIO.findall(html)}


def fetch_exam_timetable(acadsem: str, plan_no: int | None = None) -> list[list[str]] | None:
    """Rows ``[date, day, time, course, title, duration]`` for a semester's
    undergraduate exam timetable, or ``None`` if the portal hasn't released it.
    Only Semester 1/2 have one; special terms return ``None``.
    """
    year_s, sem = acadsem.split(";", 1)
    if sem not in ("1", "2"):
        return None
    year = int(year_s)
    if plan_no is None:
        label = f"AY{year}-{(year + 1) % 100:02d} SEM {sem}"
        plans = fetch_exam_plans()
        plan_no = plans.get(label)
        if plan_no is None:
            print(f"  exam timetable for {label} not released yet (portal lists: {list(plans) or 'none'})")
            return None
    form = {
        "p_exam_dt": "", "p_start_time": "", "p_dept": "", "p_subj": "", "p_venue": "", "p_matric": "",
        "academic_session": f"Semester {sem} Academic Year {year}-{year + 1}",
        "p_plan_no": plan_no, "p_exam_yr": year, "p_semester": sem, "p_type": "UE", "bOption": "Next",
    }
    html = _fetch(EXAM_DETAIL_URL, form)
    rows = [[c.strip() for c in cells[:6]] for cells in map(_EXAM_CELL.findall, _EXAM_ROW.findall(html)) if len(cells) >= 6]
    return rows or None
