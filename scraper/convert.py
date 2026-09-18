"""
convert.py
==========

Pure transforms from raw scrape output to the three files the site consumes.
No I/O: ``main.py`` reads and writes.

    courses + content  --to_mdata-->    { code: {searchKeys, code, title, au, ...} }
    courses            --to_indexes-->  { code: { index: [slot, ...] } }
    exam csv rows      --to_exams-->    { code: {date, day, start_time, end_time, key, name, duration} }
"""

from __future__ import annotations

import csv
import math
import re
from datetime import datetime, timedelta

# ---------------------------------------------------------------------------
# mdata
# ---------------------------------------------------------------------------

# Raw portal label (lowercased, no trailing colon) -> output key. Unknown labels
# land in ``extras`` untouched, so a new portal field never needs a code change
# to be preserved.
_FIELD_KEYS = {
    "prerequisite": "prerequisite",
    "remark": "notAvailableToProgramme",
    "not available to programme": "notAvailableToProgramme",
    "grade type": "gradeType",
    "mutually exclusive with": "mutuallyExclusiveWith",
    "not available to all programme with": "notAvailableToAllProgrammeWith",
    "not available as bde/ue to programme": "notAvailableAsBdeueToProgramme",
    "not available as core to programme": "notAvailableAsCoreToProgramme",
    "not available as pe to programme": "notAvailableAsPeToProgramme",
    "not offered as broadening and deepening elective": "notOfferedAsBde",
    "not offered as unrestricted elective": "notOfferedAsUe",
    "description": "description",
}

_ROMAN = frozenset("I II III IV V VI VII VIII IX X XI XII XIII XIV XV XVI XVII XVIII XIX XX".split())
_INLINE_LIST_SEP = re.compile(
    r"\s*;\s*(?=\((?:ii{1,3}|iv|vi{0,3}|ix|x{1,3}|[2-9]|\d{2,}|[b-z])\))", re.IGNORECASE
)


def smart_title(s: str) -> str:
    """Title-case, keeping Roman numerals (``Calculus II``) uppercase."""
    return re.sub(r"[A-Za-z]+", lambda m: m.group(0).upper() if m.group(0).upper() in _ROMAN else m.group(0).title(), s)


def clean_description(text: str) -> str:
    text = re.sub(r"\.([A-Z])", r". \1", text)          # missing space after full stop
    text = _INLINE_LIST_SEP.sub("\n", text)               # "(i) ...; (ii) ..." -> one per line
    if re.search(r"\n\((?:ii|iii|[2-9]|[b-z])\)", text, re.IGNORECASE):
        text = re.sub(r"(?<!\n)[ \t]+(\((?:i|1|a)\))[ \t]+", r"\n\1 ", text)  # detach preamble from "(i)"
    text = re.sub(r"(?<=[^\s\n-])-\s+(?=[A-Z(\"])", r"\n- ", text)  # "text:- Item- Item" -> dash list
    return re.sub(r" {2,}", " ", text).strip()


def parse_prerequisite(s: str) -> list[list[str]]:
    """``"A & B OR C"`` -> ``[["A", "B"], ["C"]]`` (outer = OR, inner = AND)."""
    groups = (re.split(r"\s+&\s+", g) for g in re.split(r"\s+OR\s+", s.strip()))
    return [parts for parts in ([p.strip() for p in g if p.strip()] for g in groups) if parts]


def _apply_fields(entry: dict, raw: dict[str, str], extras: dict[str, str], overwrite: bool) -> None:
    for label, value in raw.items():
        if not value:
            continue
        key = _FIELD_KEYS.get(label.lower())
        if key is None:
            extras[label] = value
        elif overwrite or key not in entry:
            if key == "prerequisite":
                entry[key] = parse_prerequisite(value)
            elif key == "mutuallyExclusiveWith":
                entry[key] = [s.strip() for s in value.split(",") if s.strip()]
            elif existing := entry.get(key):
                entry[key] = f"{existing} {value}"  # two labels mapping to one key
            else:
                entry[key] = value


def to_mdata(courses: dict[str, list[dict]], content: dict[str, list[dict]]) -> dict[str, dict]:
    """Merge the schedule and content scrapes into one entry per course code.

    A course listed under several programmes collects them all in
    ``searchKeys``. The content portal is authoritative for restriction fields;
    the schedule portal only contributes prerequisite/remark.
    """
    content_by_code: dict[str, dict] = {}
    for course_list in content.values():
        for c in course_list:
            content_by_code.setdefault(c["course_code"], c)

    result: dict[str, dict] = {}
    for search_key, course_list in courses.items():
        for course in course_list:
            code = course["course_code"]
            if code not in result:
                entry = {"searchKeys": [], "code": code, "title": smart_title(course["course_title"]), "au": str(course["credits"])}
                extras: dict[str, str] = {}
                _apply_fields(entry, course.get("fields") or {}, extras, overwrite=False)
                if c := content_by_code.get(code):
                    entry.pop("notAvailableToProgramme", None)
                    _apply_fields(entry, c.get("fields") or {}, extras, overwrite=True)
                    if c.get("description"):
                        entry["description"] = clean_description(c["description"])
                if extras:
                    entry["extras"] = extras
                result[code] = entry
            if search_key not in result[code]["searchKeys"]:
                result[code]["searchKeys"].append(search_key)

    for entry in result.values():
        for k in ("prerequisite", "mutuallyExclusiveWith"):
            if entry.get(k) == []:
                del entry[k]
    return dict(sorted(result.items()))


# ---------------------------------------------------------------------------
# indexes
# ---------------------------------------------------------------------------

DAYS = {"MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6, "SUN": 7}


def duration_units(time_range: str) -> int:
    """``"1430-1720"`` -> 30-minute units, rounded up. 0 if unparseable."""
    try:
        start, end = time_range.split("-")
        mins = (int(end[:2]) * 60 + int(end[2:])) - (int(start[:2]) * 60 + int(start[2:]))
        return math.ceil(mins / 30)
    except ValueError:
        return 0


def to_indexes(courses: dict[str, list[dict]]) -> dict[str, dict[str, list[dict]]]:
    result: dict[str, dict[str, list[dict]]] = {}
    for course_list in courses.values():
        for course in course_list:
            by_index = result.setdefault(course["course_code"], {})
            for s in course.get("schedules", []):
                slot = {
                    "key": s["index"],
                    # "LEC/STUDIO" (art & design, since 2025;2) -> "LEC"
                    "type": s.get("type", "").split("/")[0],
                    "group": s.get("group", ""),
                    "day": DAYS.get(s.get("day", "").upper(), 0),
                    "time": s.get("time", ""),
                    "venue": s.get("venue", ""),
                    "remarks": s.get("remark", ""),
                    "duration": duration_units(s.get("time", "")),
                }
                slots = by_index.setdefault(s["index"], [])
                if slot not in slots:  # same course under several programmes
                    slots.append(slot)
    return dict(sorted(result.items()))


# ---------------------------------------------------------------------------
# exams
# ---------------------------------------------------------------------------

EXAM_CSV_HEADER = ["Date", "Day", "Time", "Course", "Course Title", "Duration"]


def to_exams(csv_text: str) -> dict[str, dict]:
    """Exam CSV (``Date,Day,Time,Course,Course Title,Duration``; any preamble
    lines before the header are skipped) -> exam JSON keyed by course code."""
    lines = [ln for ln in csv_text.splitlines() if ln.strip()]
    start = next((i for i, ln in enumerate(lines) if next(csv.reader([ln]))[:1] == ["Date"]), None)
    if start is None:
        raise ValueError("Exam CSV has no 'Date,...' header row")

    result: dict[str, dict] = {}
    for row in csv.DictReader(lines[start:]):
        code = (row.get("Course") or "").strip().upper()
        date_s, time_s = (row.get("Date") or "").strip(), (row.get("Time") or "").strip()
        if not code or not date_s or not time_s:
            continue
        dur = (row.get("Duration") or "").lower()
        hours = int(m.group(1)) if (m := re.search(r"(\d+)\s*hr", dur)) else 0
        mins = int(m.group(1)) if (m := re.search(r"(\d+)\s*min", dur)) else 0
        units = (hours * 60 + mins) // 30
        date = datetime.strptime(date_s, "%d %B %Y")
        start_t = datetime.strptime(time_s.lower(), "%I.%M %p")
        end_t = start_t + timedelta(minutes=units * 30)
        result[code] = {
            "date": date.strftime("%d %B %Y").lstrip("0"),
            "day": date.weekday() + 1,
            "start_time": start_t.strftime("%I.%M %p").lstrip("0").lower(),
            "end_time": end_t.strftime("%I.%M %p").lstrip("0").lower(),
            "key": code,
            "name": (row.get("Course Title") or "").strip(),
            "duration": units,
        }
    return dict(sorted(result.items()))
