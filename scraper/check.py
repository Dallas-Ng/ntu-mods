"""
check.py
========

Gate between "scraped" and "published". Validates a semester's
03_mdata / 04_indexes / 05_exams triplet against the data invariants and diffs
it against what is live in src/data/api. Exit 1 = do not publish.

    python3 check.py "2026;1"

``main.py`` runs this automatically before --load / --upsync.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
API_DIR = Path(__file__).parent.parent / "src" / "data" / "api"

SLOT_TYPES = {"LEC", "LAB", "SEM", "TUT", "DES", "PRJ"}
TIME_RE = re.compile(r"^(\d{2})(\d{2})-(\d{2})(\d{2})$")
CLOCK_RE = re.compile(r"^\d{1,2}\.\d{2} [ap]m$")
#: New total below this fraction of the live total is a portal failure, not churn.
MIN_KEEP = 0.8
#: More than this share of surviving courses losing a content-portal field means step 2b failed.
MAX_FIELD_LOSS = 0.05


def check(mdata: dict, indexes: dict, exams: dict, live: dict[str, dict] | None) -> tuple[list[str], list[str]]:
    """Returns ``(problems, notes)``. Any problem means do not publish."""
    problems: list[str] = []
    notes: list[str] = []

    # --- invariants -------------------------------------------------------
    for code, m in mdata.items():
        for k in ("code", "title", "au", "searchKeys"):
            if not m.get(k):
                problems.append(f"mdata {code}: missing {k}")
        try:
            if float(m.get("au", "x")) < 0:
                problems.append(f"mdata {code}: au={m['au']!r} negative")
        except ValueError:
            problems.append(f"mdata {code}: au={m.get('au')!r} not a number")
        p = m.get("prerequisite")
        if p is not None and not (isinstance(p, list) and all(isinstance(g, list) and all(isinstance(x, str) for x in g) for g in p)):
            problems.append(f"mdata {code}: prerequisite not list[list[str]]")
        for k, v in m.items():
            if v == "":
                problems.append(f"mdata {code}: empty string in {k}")

    no_day = 0
    for code, by_index in indexes.items():
        if mdata and code not in mdata:
            problems.append(f"indexes {code}: not in mdata")
        for index, slots in by_index.items():
            for s in slots:
                if set(s) != {"key", "type", "group", "day", "time", "venue", "remarks", "duration"} or s["key"] != index:
                    problems.append(f"indexes {code}/{index}: bad slot shape")
                    continue
                if s["type"] not in SLOT_TYPES:
                    notes.append(f"indexes {code}/{index}: unknown type {s['type']!r}")
                if s["day"] == 0:
                    no_day += 1
                elif not 1 <= s["day"] <= 7:
                    problems.append(f"indexes {code}/{index}: day={s['day']}")
                if m := TIME_RE.match(s["time"]):
                    h1, m1, h2, m2 = map(int, m.groups())
                    start, end = h1 * 60 + m1, h2 * 60 + m2
                    if not (0 <= start < end <= 23 * 60 + 59):
                        problems.append(f"indexes {code}/{index}: time {s['time']} out of range")
                    elif s["duration"] != -(-(end - start) // 30):
                        problems.append(f"indexes {code}/{index}: duration {s['duration']} != ceil({end - start}/30)")
                elif s["time"]:
                    problems.append(f"indexes {code}/{index}: time {s['time']!r} not HHMM-HHMM")
    if no_day:
        notes.append(f"{no_day} slots with no scheduled day (day=0) — valid for distance learning, flag if unexpectedly high")

    orphans = [c for c in exams if c not in mdata]
    if mdata and orphans:
        notes.append(f"{len(orphans)} exams for courses not in mdata (normal, a dozen or so): {orphans[:10]}")
    for code, e in exams.items():
        if not 1 <= e.get("day", 0) <= 7:
            problems.append(f"exams {code}: day={e.get('day')}")
        for k in ("start_time", "end_time"):
            if not CLOCK_RE.match(e.get(k, "")):
                problems.append(f"exams {code}: {k}={e.get(k)!r}")

    empty = [c for c in mdata if not indexes.get(c)]
    if indexes and empty:
        notes.append(f"{len(empty)} courses with zero indexes (may be distance learning): {empty[:10]}")

    # --- diff against live ------------------------------------------------
    if live is None:
        notes.append("no live data for this semester yet — first publish, diff skipped")
        return problems, notes

    for kind, new in (("mdata", mdata), ("indexes", indexes), ("exams", exams)):
        old = live[kind]
        if not new and kind != "exams":
            continue  # not part of this run's scope
        common = set(new) & set(old)
        changed = sum(new[k] != old[k] for k in common)
        notes.append(f"{kind}: live {len(old)} -> new {len(new)} | +{len(set(new) - set(old))} -{len(set(old) - set(new))} ~{changed}")
        if old and len(new) < len(old) * MIN_KEEP:
            problems.append(f"{kind}: new total {len(new)} is below {MIN_KEEP:.0%} of live {len(old)} — looks like a portal failure")
        if kind == "mdata":
            for f in ("description", "gradeType", "prerequisite"):
                lost = [k for k in common if old[k].get(f) and not new[k].get(f)]
                if lost:
                    notes.append(f"mdata: {len(lost)} surviving courses lost {f}: {sorted(lost)[:10]}")
                if f != "prerequisite" and common and len(lost) > len(common) * MAX_FIELD_LOSS:
                    problems.append(f"mdata: {len(lost)}/{len(common)} surviving courses lost {f} — content scrape (step 2b) failed")
    return problems, notes


def load_live(sem_key: str) -> dict[str, dict] | None:
    paths = {k: API_DIR / d / f"{sem_key}.json" for k, d in (("mdata", "metadata"), ("indexes", "indexes"), ("exams", "exams"))}
    if not paths["mdata"].exists():
        return None
    return {k: json.loads(p.read_text()) if p.exists() else {} for k, p in paths.items()}


def check_semester(acadsem: str) -> bool:
    """Run the check for one semester, print the report, return ok/not."""
    key = acadsem.replace(";", "_")
    def read(name):  # missing file = {} so --scope exams works without a course scrape
        p = DATA_DIR / f"{name}_{key}.json"
        return json.loads(p.read_text()) if p.exists() else {}
    problems, notes = check(read("03_mdata"), read("04_indexes"), read("05_exams"), load_live(key))
    print(f"[Check] {acadsem}")
    for n in notes:
        print(f"  note: {n}")
    for p in problems[:50]:
        print(f"  PROBLEM: {p}")
    if len(problems) > 50:
        print(f"  ... and {len(problems) - 50} more problems")
    print(f"  {'OK — safe to publish' if not problems else f'{len(problems)} problem(s) — do not publish'}")
    return not problems


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit('usage: python3 check.py "YYYY;S"')
    sys.exit(0 if check_semester(sys.argv[1]) else 1)
