"""
academic_calendar.py
====================

Reads NTU's semester academic calendar PDF into ``src/data/api/calendar.json``:
the Monday of every teaching week, recess week, the revision and exam weeks,
the days with no classes, the days classes end early, and the key events.

The calendar only exists as a designed one-page PDF. Text extraction alone
loses most of it, because NTU marks teaching, recess and exam weeks by cell
colour. LiteParse returns both the positioned text and the filled shapes, so:

- each month grid is located by its header ("AUGUST") and its S M T W T F S
  row; every day number is placed in a column, and the column must agree with
  the real weekday of that date or the parse is rejected
- the grey number left of a row is its teaching week
- the fill behind a day is matched to the nearest legend swatch (NTU's grid
  colours drift a little from the legend's)
- a red day number is a day with no classes (a holiday, or the Monday
  replacement for a Sunday one)
- the right-hand tables give event and holiday names and dates

Every rule above is checked (13 teaching weeks, one recess week between
weeks 7 and 8, contiguous exam weeks, every red day explained by a holiday).
Any failure prints ``PROBLEM:`` and exits 1, like check.py; nothing is written.

    python3 academic_calendar.py                    # newest confirmed calendar, check only
    python3 academic_calendar.py --upsync           # ...and merge into src/data/api/calendar.json
    python3 academic_calendar.py --year 2027 --indicative   # an indicative calendar
    python3 academic_calendar.py --pdf calendar.pdf # a local file instead of the website
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

SCRAPER_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRAPER_DIR / "data"
API_CALENDAR = SCRAPER_DIR.parent / "src" / "data" / "api" / "calendar.json"

MONTHS = {m: i for i, m in enumerate(
    ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY",
     "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"], start=1)}
MONTH_ABBR = {m[:3].title(): i for m, i in MONTHS.items()}

#: Colours as LiteParse reports them: ARGB hex.
GREY = "ff808080"
RED = "ffff0000"
#: Table headings ("UNIVERSITY KEY EVENTS").
HEADING = "ff003478"

#: Legend labels -> the key this module stores the range under.
LEGEND = {
    "University Orientation Week": "orientation",
    "Teaching Week": "teaching",
    "Recess Week": "recess",
    "Revision and Examination Week": "exams",
}

#: How far a grid fill may drift from its legend swatch (RGB distance).
MAX_COLOUR_DISTANCE = 60

TEACHING_WEEKS = 13
RECESS_AFTER_WEEK = 7


class CalendarError(Exception):
    pass


@dataclass
class Item:
    text: str
    x: float
    y: float
    w: float
    h: float
    colour: str
    italic: bool = False

    @property
    def cx(self) -> float:
        return self.x + self.w / 2

    @property
    def cy(self) -> float:
        return self.y + self.h / 2


@dataclass
class Shape:
    x: float
    y: float
    w: float
    h: float
    colour: str

    def contains(self, x: float, y: float) -> bool:
        return self.x <= x <= self.x + self.w and self.y <= y <= self.y + self.h


@dataclass
class Day:
    date: dt.date
    item: Item
    semester: str
    kind: str | None = None  # legend key of the fill behind it
    week: int | None = None


@dataclass
class Parsed:
    academic_year: int
    days: list[Day] = field(default_factory=list)
    week_mondays: dict[str, dict[int, set[dt.date]]] = field(default_factory=dict)
    events: list[dict] = field(default_factory=list)
    holidays: list[dict] = field(default_factory=list)
    footnotes: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    published: str | None = None


# ---------------------------------------------------------------------------
# PDF -> items and shapes
# ---------------------------------------------------------------------------

def load_pdf(pdf: bytes | str) -> tuple[list[Item], list[Shape]]:
    """Positioned text items and filled shapes of the calendar's only page."""
    from liteparse import LiteParse  # imported here so test_convert.py etc. never need it

    parser = LiteParse(ocr_enabled=False, extract_text_metadata=True,
                       extract_vector_graphics=True, quiet=True)
    try:
        result = parser.parse(pdf)
    finally:
        parser.close()
    if len(result.pages) != 1:
        raise CalendarError(f"expected a one-page calendar, got {len(result.pages)} pages")
    page = result.pages[0]
    items = [Item(t.text.strip(), t.x, t.y, t.width, t.height, (t.fill_color or "").lower(),
                  "italic" in (t.font_name or "").lower())
             for t in page.text_items if t.text.strip()]
    shapes = [Shape(*s.bbox, s.fill_color.lower())
              for s in page.vector_graphics.shapes if s.fill and s.fill_color]
    return items, shapes


# ---------------------------------------------------------------------------
# Small parsers
# ---------------------------------------------------------------------------

def _rgb(argb: str) -> tuple[int, int, int]:
    return int(argb[2:4], 16), int(argb[4:6], 16), int(argb[6:8], 16)


def colour_distance(a: str, b: str) -> float:
    return sum((p - q) ** 2 for p, q in zip(_rgb(a), _rgb(b))) ** 0.5


_DATE_SIDE = re.compile(r"^(\d{1,2})(?:\s+([A-Z][a-z]{2}))?(?:\s+(\d{4}))?$")


def parse_date_range(text: str) -> tuple[dt.date, dt.date]:
    """``"9 Aug 2026 (Sun)*"``, ``"3 - 4 Aug 2026"``, ``"21 Jul - 1 Aug 2026"``,
    ``"6 - 7 Feb 2027 (Sat - Sun)*^"`` -> (first, last) day, inclusive."""
    clean = re.sub(r"\([^)]*\)", "", text).replace("*", "").replace("^", "")
    clean = re.sub(r"\s+", " ", clean).strip()
    parts = [p.strip() for p in clean.split("-")]
    if len(parts) not in (1, 2) or not all(parts):
        raise CalendarError(f"unreadable date: {text!r}")
    sides = [_DATE_SIDE.match(p) for p in parts]
    if not all(sides):
        raise CalendarError(f"unreadable date: {text!r}")
    end_d, end_m, end_y = sides[-1].groups()
    if not (end_m and end_y) or end_m not in MONTH_ABBR:
        raise CalendarError(f"unreadable date: {text!r}")
    end = dt.date(int(end_y), MONTH_ABBR[end_m], int(end_d))
    start_d, start_m, start_y = sides[0].groups()
    if start_m and start_m not in MONTH_ABBR:
        raise CalendarError(f"unreadable date: {text!r}")
    start = dt.date(int(start_y or end.year), MONTH_ABBR[start_m] if start_m else end.month, int(start_d))
    if start > end:  # "28 Dec - 2 Jan 2027": the start is in the previous year
        start = start.replace(year=start.year - 1)
    return start, end


def _week_start(d: dt.date) -> dt.date:
    """Monday of the ISO week (Monday to Sunday) holding ``d``."""
    return d - dt.timedelta(days=d.weekday())


def _row_monday(d: dt.date) -> dt.date:
    """Monday of the calendar row holding ``d``. NTU's grids run Sunday to
    Saturday, so a Sunday belongs with the Monday after it."""
    return d + dt.timedelta(days=1 - (d.weekday() + 1) % 7)


def _rows(items: list[Item], tolerance: float = 6) -> list[list[Item]]:
    """Group items into visual rows by vertical centre, each row sorted by x."""
    rows: list[list[Item]] = []
    for it in sorted(items, key=lambda i: i.cy):
        if rows and abs(rows[-1][0].cy - it.cy) <= tolerance:
            rows[-1].append(it)
        else:
            rows.append([it])
    return [sorted(r, key=lambda i: i.x) for r in rows]


# ---------------------------------------------------------------------------
# The page
# ---------------------------------------------------------------------------

def parse_items(items: list[Item], shapes: list[Shape]) -> Parsed:
    title = next((i for i in items if re.search(r"ACADEMIC CALENDAR \(SEMESTER\): AY\d{4}-\d{2}", i.text)), None)
    if not title:
        raise CalendarError("no 'ACADEMIC CALENDAR (SEMESTER): AYyyyy-yy' title; is this the semester calendar?")
    ay = int(re.search(r"AY(\d{4})", title.text).group(1))
    out = Parsed(academic_year=ay)

    # Section bands: "SEMESTER 1" / "SEMESTER 2" / "SPECIAL TERM" headings.
    sections = sorted(
        [(i.y, s) for i in items for s in ("1", "2", "S")
         if i.text == {"1": "SEMESTER 1", "2": "SEMESTER 2", "S": "SPECIAL TERM"}[s]])
    if [s for _, s in sections][:2] != ["1", "2"]:
        raise CalendarError(f"expected SEMESTER 1 then SEMESTER 2 headings, found {[s for _, s in sections]}")

    def section_at(y: float) -> str | None:
        current = None
        for top, s in sections:
            if y >= top:
                current = s
        return current

    # The right column (legend, events, holidays) starts at the LEGEND heading.
    legend_head = next((i for i in items if i.text == "LEGEND"), None)
    if not legend_head:
        raise CalendarError("no LEGEND heading")
    right_x = legend_head.x - 5
    left = [i for i in items if i.x < right_x]
    right = [i for i in items if i.x >= right_x]

    legend = _legend_colours(right, shapes)
    _read_grids(left, shapes, legend, ay, sections, section_at, out)
    _read_tables(right, out)
    published = re.search(r"(\d{1,2} [A-Z][a-z]+)", " ".join(
        i.text for i in items if abs(i.cy - next((p.cy for p in items if p.text == "Published on"), -99)) < 8))
    out.published = published.group(1) if published else None
    return out


def _legend_colours(right: list[Item], shapes: list[Shape]) -> dict[str, str]:
    """legend key -> swatch colour: the filled square just left of each label."""
    colours = {}
    for label, key in LEGEND.items():
        item = next((i for i in right if i.text == label), None)
        if not item:
            raise CalendarError(f"legend has no {label!r}")
        swatch = [s for s in shapes if s.w < 30 and s.h < 30 and s.x + s.w <= item.x + 2
                  and item.x - (s.x + s.w) < 15 and s.contains(s.x + s.w / 2, item.cy)]
        if len(swatch) != 1:
            raise CalendarError(f"legend {label!r}: expected one colour swatch, found {len(swatch)}")
        colours[key] = swatch[0].colour
    return colours


def _read_grids(left: list[Item], shapes: list[Shape], legend: dict[str, str], ay: int,
                sections: list[tuple[float, str]], section_at, out: Parsed) -> None:
    month_heads = [i for i in left if i.text in MONTHS]
    dow_items = [i for i in left if i.text in "SMTWF" and len(i.text) == 1]
    numbers = [i for i in left if i.text.isdigit() and len(i.text) <= 2]
    taken: set[int] = set()
    week_labels: list[tuple[str, int, Item, float, float]] = []

    for head in sorted(month_heads, key=lambda i: (i.y, i.x)):
        semester = section_at(head.y)
        if semester not in ("1", "2"):
            continue  # Special Term: no data on the site needs it yet
        month = MONTHS[head.text]
        year = ay if month >= 7 else ay + 1

        # The month name sits in a filled bar as wide as its grid; the weekday
        # row is the 7 letters just under that bar.
        bars = [s for s in shapes if s.contains(head.cx, head.cy) and 100 < s.w < 250 and s.h < 40]
        if len(bars) != 1:
            raise CalendarError(f"{head.text} {year}: expected one header bar, found {len(bars)}")
        bar = bars[0]
        row = sorted((i for i in dow_items if 0 < i.cy - (bar.y + bar.h) < 20
                      and bar.x - 2 <= i.cx <= bar.x + bar.w + 2), key=lambda i: i.x)
        if [i.text for i in row] != list("SMTWTFS"):
            raise CalendarError(f"{head.text} {year}: weekday header reads {''.join(i.text for i in row)!r}")
        cols = [i.cx for i in row]
        pitch = (cols[-1] - cols[0]) / 6
        top = row[0].cy
        # The block ends where the next month header below starts.
        below = [h.y for h in month_heads if h.y > head.y + 20 and bar.x <= h.cx <= bar.x + bar.w]
        # ...or at the next section heading ("SEMESTER 2"), whichever is first.
        below += [top_y for top_y, _ in sections if top_y > head.y]
        bottom = min(below) if below else float("inf")

        for idx, it in enumerate(numbers):
            if not (top + 5 < it.cy < bottom) or idx in taken:
                continue
            if it.colour == GREY:
                # Teaching week number: sits one column left of Sunday.
                if cols[0] - 2.2 * pitch < it.cx < cols[0] - 0.5 * pitch:
                    taken.add(idx)
                    week_labels.append((semester, int(it.text), it, cols[0], cols[-1]))
                continue
            col = min(range(7), key=lambda c: abs(cols[c] - it.cx))
            if abs(cols[col] - it.cx) > pitch / 2:
                continue
            taken.add(idx)
            try:
                date = dt.date(year, month, int(it.text))
            except ValueError:
                raise CalendarError(f"{head.text} {year}: no day {it.text}")
            # Column 0 is Sunday; date.weekday() has Monday as 0.
            if (date.weekday() + 1) % 7 != col:
                raise CalendarError(f"{date}: printed under {'SMTWTFS'[col]} but is a {date:%A}")
            fill = [s for s in shapes if s.contains(it.cx, it.cy) and s.w < 200 and s.h < 40]
            kind = None
            if fill:
                best = min(legend, key=lambda k: colour_distance(legend[k], fill[-1].colour))
                if colour_distance(legend[best], fill[-1].colour) <= MAX_COLOUR_DISTANCE:
                    kind = best
            out.days.append(Day(date, it, semester, kind))

    # A week label's row is the days level with it in the same month grid.
    for semester, week, it, sunday_x, saturday_x in week_labels:
        row = [d for d in out.days if d.semester == semester and abs(d.item.cy - it.cy) < 6
               and sunday_x - 15 <= d.item.cx <= saturday_x + 15]
        if not row:
            raise CalendarError(f"Semester {semester} week {week}: number with no days beside it")
        out.week_mondays.setdefault(semester, {}).setdefault(week, set()).add(_row_monday(row[0].date))


def _read_tables(right: list[Item], out: Parsed) -> None:
    """Key events and public holidays (name left, date right), then the
    footnotes under the holidays, up to the next heading (the NSmen notice)."""
    heads = sorted((i for i in right if i.colour == HEADING), key=lambda i: i.y)
    names = [h.text for h in heads]
    for needed in ("UNIVERSITY KEY EVENTS", "SINGAPORE PUBLIC HOLIDAYS"):
        if needed not in names:
            raise CalendarError(f"missing table heading {needed!r}; found {names}")
    ev_top = heads[names.index("UNIVERSITY KEY EVENTS")].y
    ph_top = heads[names.index("SINGAPORE PUBLIC HOLIDAYS")].y
    after = [h.y for h in heads if h.y > ph_top]
    end = min(after) if after else float("inf")

    rows = _rows([i for i in right if ev_top + 5 < i.y < end and i.colour != HEADING])
    name_x = min(i.x for r in rows for i in r)
    date_x = min((i.x for r in rows for i in r if i.x > name_x + 100), default=None)
    if date_x is None:
        raise CalendarError("events table has no date column")

    current: dict | None = None
    in_footnotes = False
    for row in rows:
        y = row[0].y
        label = " ".join(i.text for i in row if i.x < date_x - 5)
        value = " ".join(i.text for i in row if i.x >= date_x - 5)
        if y > ph_top and (in_footnotes or label.startswith(("*", "^", "Public holiday dates"))):
            # Footnotes run the full width, so rejoin the whole row.
            text = " ".join(i.text for i in row)
            if text.startswith(("*", "^")):
                out.footnotes.append(text)
            elif in_footnotes and out.footnotes:
                out.footnotes[-1] += " " + text
            in_footnotes = True
            continue
        target = out.events if y < ph_top else out.holidays
        if label and re.fullmatch(r"TB[AC]", value.strip()):
            out.notes.append(f"{label}: date not announced yet ({value.strip()}), left out")
            current = None
            continue
        if label and value:
            try:
                start, last = parse_date_range(value)
            except CalendarError:
                raise CalendarError(f"{label!r}: {value!r} is not a date")
            current = {"name": label, "start": start.isoformat(), "end": last.isoformat()}
            flags = re.sub(r"[^*^]", "", value)
            if flags:
                current["flags"] = flags
            note = re.search(r"\(([^)]*)\)", value)
            if note and not re.fullmatch(r"(Mon|Tue|Wed|Thu|Fri|Sat|Sun)( - (Mon|Tue|Wed|Thu|Fri|Sat|Sun))?", note[1]):
                current["note"] = note[1]
            target.append(current)
        elif value and not label and current is not None and target is out.events:
            try:
                # A second date for the same event, e.g. "4 - 8 Jan 2027 (For PG Only)".
                start, last = parse_date_range(value)
            except CalendarError:
                # A note under a date, e.g. "No classes for UG ... hours."
                current["note"] = f"{current['note']} {value}" if current.get("note") else value
                continue
            current = {"name": current["name"], "start": start.isoformat(), "end": last.isoformat()}
            note = re.search(r"\(([^)]*)\)", value)
            if note:
                current["note"] = note[1]
            target.append(current)
        else:
            raise CalendarError(f"unexpected table row: {label!r} / {value!r}")


# ---------------------------------------------------------------------------
# Parsed page -> calendar data, with every rule checked
# ---------------------------------------------------------------------------

def _ranges(dates: list[dt.date]) -> list[tuple[dt.date, dt.date]]:
    """Contiguous runs, where a run may skip weekends."""
    runs: list[list[dt.date]] = []
    for d in sorted(set(dates)):
        if runs and (d - runs[-1][-1]).days <= 3 and all(
                (runs[-1][-1] + dt.timedelta(days=k)).weekday() >= 5 for k in range(1, (d - runs[-1][-1]).days)):
            runs[-1].append(d)
        else:
            runs.append([d])
    return [(r[0], r[-1]) for r in runs]




def build(parsed: Parsed) -> tuple[dict, list[str]]:
    """The calendar for one academic year, and every PROBLEM found."""
    problems: list[str] = []
    ay = parsed.academic_year
    semesters = {}

    for sem in ("1", "2"):
        code = f"{ay};{sem}"
        weeks = parsed.week_mondays.get(sem, {})
        mondays: dict[int, dt.date] = {}
        for w in range(1, TEACHING_WEEKS + 1):
            found = weeks.get(w, set())
            if len(found) != 1:
                problems.append(f"{code}: teaching week {w} resolves to {sorted(map(str, found)) or 'nothing'}")
            else:
                mondays[w] = next(iter(found))
        extra = sorted(set(weeks) - set(range(1, TEACHING_WEEKS + 1)))
        if extra:
            problems.append(f"{code}: unexpected teaching week numbers {extra}")

        days = [d for d in parsed.days if d.semester == sem]
        recess = sorted(d.date for d in days if d.kind == "recess" and d.date.weekday() < 5)
        exams = sorted(d.date for d in days if d.kind == "exams" and d.date.weekday() < 5)
        teaching = sorted(d.date for d in days if d.kind == "teaching")

        if len(mondays) == TEACHING_WEEKS:
            for w in range(2, TEACHING_WEEKS + 1):
                gap = (mondays[w] - mondays[w - 1]).days
                expected = 14 if w == RECESS_AFTER_WEEK + 1 else 7
                if gap != expected:
                    problems.append(f"{code}: week {w - 1} -> {w} is {gap} days apart, expected {expected}")
            recess_week = mondays[RECESS_AFTER_WEEK] + dt.timedelta(days=7)
            if {_week_start(d) for d in recess} != {recess_week}:
                problems.append(f"{code}: recess-coloured days {[str(d) for d in recess]} are not the week of {recess_week}")
            outside = [str(d) for d in teaching if _row_monday(d) not in mondays.values()]
            if outside:
                problems.append(f"{code}: teaching-coloured days outside weeks 1-13: {outside[:5]}")
        else:
            recess_week = None

        exam_runs = _ranges(exams)
        if len(exam_runs) != 1:
            problems.append(f"{code}: expected one revision and exam period, found {[(str(a), str(b)) for a, b in exam_runs]}")
        elif len(mondays) == TEACHING_WEEKS and exam_runs[0][0] <= mondays[TEACHING_WEEKS]:
            problems.append(f"{code}: exam period starts {exam_runs[0][0]}, before week 13 ends")

        entry = {"teachingWeeks": {str(w): mondays[w].isoformat() for w in sorted(mondays)}}
        if recess_week:
            entry["recess"] = {"start": recess_week.isoformat(), "end": (recess_week + dt.timedelta(days=4)).isoformat()}
        if exam_runs:
            entry["revisionAndExams"] = {"start": exam_runs[0][0].isoformat(), "end": exam_runs[-1][1].isoformat()}
        semesters[code] = entry

    # Red day numbers are the days without classes; each must be a holiday,
    # or the Monday after a Sunday holiday (footnote *).
    holidays = []
    holiday_days: dict[dt.date, str] = {}
    for h in parsed.holidays:
        start, end = dt.date.fromisoformat(h["start"]), dt.date.fromisoformat(h["end"])
        holidays.append(h)
        d = start
        while d <= end:
            holiday_days[d] = h["name"]
            d += dt.timedelta(days=1)
    if not holidays:
        problems.append("no public holidays read")

    no_class = []
    for day in sorted({d.date: d for d in parsed.days if d.item.colour == RED}.values(), key=lambda d: d.date):
        name = holiday_days.get(day.date)
        if not name and day.date.weekday() == 0 and holiday_days.get(day.date - dt.timedelta(days=1)):
            name = f"{holiday_days[day.date - dt.timedelta(days=1)]} (replacement holiday)"
        if not name:
            problems.append(f"{day.date} is marked red (no classes) but matches no listed holiday")
            continue
        no_class.append({"date": day.date.isoformat(), "name": name})
    for d, name in holiday_days.items():
        in_term = any(dt.date.fromisoformat(s["teachingWeeks"]["1"]) <= d <= dt.date.fromisoformat(
            s.get("revisionAndExams", {}).get("end", s["teachingWeeks"].get(str(TEACHING_WEEKS), "1900-01-01")))
            for s in semesters.values() if "1" in s["teachingWeeks"])
        if in_term and d.weekday() < 5 and d.isoformat() not in {n["date"] for n in no_class}:
            problems.append(f"{name} on {d} is a weekday in term but is not marked red in the grid")

    # Footnote ^: classes end at 1430 on the eves of the named holidays.
    early = []
    for note in parsed.footnotes:
        m = re.search(r"Classes will end at (\d{4}) hours on eves of the following Public Holidays: (.+)", note)
        if not m:
            continue
        until = f"{m[1][:2]}:{m[1][2:]}"
        named = [n.strip() for n in re.split(r",| and ", m[2]) if n.strip()]
        for n in named:
            h = next((h for h in holidays if h["name"].lower() == n.lower()), None)
            if not h:
                problems.append(f"early-dismissal footnote names {n!r}, which is not in the holiday list")
                continue
            eve = dt.date.fromisoformat(h["start"]) - dt.timedelta(days=1)
            if eve.weekday() < 5 and eve not in holiday_days:
                early.append({"date": eve.isoformat(), "until": until, "name": f"Eve of {h['name']}"})
    if any("^" in h.get("flags", "") for h in holidays) and not early:
        problems.append("holidays carry ^ but the early-dismissal footnote was not read")

    events = []
    for e in parsed.events:
        event = {k: v for k, v in e.items() if k != "flags"}
        m = re.search(r"No classes for UG programmes from (\d{4}) to (\d{4}) hours", e.get("note", ""))
        if m:
            event["noClasses"] = {"from": f"{m[1][:2]}:{m[1][2:]}", "to": f"{m[2][:2]}:{m[2][2:]}"}
        events.append(event)
    if not events:
        problems.append("no key events read")

    calendar = {
        "semesters": semesters,
        "noClassDays": no_class,
        "earlyDismissals": sorted(early, key=lambda e: e["date"]),
        "publicHolidays": [{k: v for k, v in h.items() if k != "flags"} for h in holidays],
        "events": events,
    }
    return calendar, problems


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--year", type=int, help="academic year, e.g. 2026 for AY2026-27 (default: newest confirmed)")
    p.add_argument("--indicative", action="store_true", help="allow an indicative (provisional) calendar")
    p.add_argument("--pdf", help="parse this local PDF instead of downloading one")
    p.add_argument("--upsync", action="store_true", help="merge into src/data/api/calendar.json after checking (then commit + push)")
    p.add_argument("--dry-run", action="store_true", help="with --upsync: show what would change, write nothing")
    p.add_argument("--force", action="store_true", help="publish even if the check finds problems")
    a = p.parse_args()

    if a.pdf:
        source, indicative, pdf = None, False, str(Path(a.pdf).resolve())
    else:
        import portal
        listed = portal.fetch_calendar_pdf_urls()
        print(f"[Calendar] page lists: {', '.join(f'AY{y}' + (' (indicative)' if v['indicative'] else '') for y, v in sorted(listed.items()))}")
        if a.year is None:
            confirmed = [y for y, v in listed.items() if not v["indicative"]]
            if not confirmed:
                raise SystemExit("No confirmed calendar listed; pass --year and --indicative to use a provisional one.")
            a.year = max(confirmed)
        if a.year not in listed:
            raise SystemExit(f"AY{a.year} is not listed on {portal.CALENDAR_PAGE_URL}")
        entry = listed[a.year]
        if entry["indicative"] and not a.indicative:
            raise SystemExit(f"AY{a.year} is only indicative; pass --indicative to use it anyway.")
        source, indicative = str(entry["url"]), bool(entry["indicative"])
        print(f"[Calendar] downloading {source}")
        pdf = portal.fetch_bytes(source)

    try:
        parsed = parse_items(*load_pdf(pdf))
        calendar, problems = build(parsed)
    except CalendarError as e:
        calendar, problems, parsed = None, [str(e)], None

    if calendar:
        if a.year and parsed.academic_year != a.year:
            problems.append(f"asked for AY{a.year} but the PDF is AY{parsed.academic_year}")
        calendar = {"academicYear": parsed.academic_year, "indicative": indicative,
                    **({"source": source} if source else {}),
                    **({"publishedOn": parsed.published} if parsed.published else {}), **calendar}
        _print_summary(calendar)
        DATA_DIR.mkdir(exist_ok=True)
        out = DATA_DIR / f"06_calendar_{parsed.academic_year}.json"
        out.write_text(json.dumps(calendar, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"[Calendar] wrote {out.relative_to(SCRAPER_DIR)}")

    for note in parsed.notes if parsed else []:
        print(f"NOTE: {note}")
    for problem in problems:
        print(f"PROBLEM: {problem}")
    if problems and not a.force:
        print("[Check] FAILED — do not publish")
        sys.exit(1)
    print("[Check] OK — safe to publish" if not problems else "[Check] problems ignored (--force)")

    if a.upsync and calendar:
        upsync(calendar, a.dry_run)


def _print_summary(c: dict) -> None:
    for code, s in c["semesters"].items():
        weeks = s["teachingWeeks"]
        print(f"  {code}: week 1 {weeks.get('1')}, week 13 {weeks.get('13')}, "
              f"recess {s.get('recess', {}).get('start')}, exams {s.get('revisionAndExams', {}).get('start')}"
              f" to {s.get('revisionAndExams', {}).get('end')}")
    print(f"  {len(c['noClassDays'])} no-class days, {len(c['earlyDismissals'])} early dismissals, "
          f"{len(c['publicHolidays'])} holidays, {len(c['events'])} events")


def upsync(calendar: dict, dry_run: bool) -> None:
    """Merge one academic year into src/data/api/calendar.json, keyed by year."""
    current = json.loads(API_CALENDAR.read_text(encoding="utf-8")) if API_CALENDAR.exists() else {}
    key = str(calendar["academicYear"])
    if current.get(key) == calendar:
        print(f"[Upsync] AY{key} unchanged in {API_CALENDAR.name}")
        return
    if current.get(key) and not current[key].get("indicative") and calendar["indicative"]:
        raise SystemExit(f"Refusing to replace confirmed AY{key} with an indicative calendar.")
    merged = {**current, key: calendar}
    merged = {k: merged[k] for k in sorted(merged)}
    print(f"[Upsync] AY{key} -> src/data/api/{API_CALENDAR.name}{' (dry run)' if dry_run else ''}")
    if not dry_run:
        API_CALENDAR.write_text(json.dumps(merged, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
