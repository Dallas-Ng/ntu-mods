#!/usr/bin/env python3
"""
compare_agent.py
================
Claude-powered validation agent for NTU course scraper output.

Independently fetches live NTU portal data and compares it against
the scraped JSON files to detect extraction and transformation errors.

Usage:
    python3 compare_agent.py
    python3 compare_agent.py --semester "2025;2"
    python3 compare_agent.py --semester latest
    python3 compare_agent.py --semester "2025;2" --workers 4 --sample 20
    python3 compare_agent.py --semester "2025;2" --skip-scrape
    python3 compare_agent.py --semester "2025;2" --run-scraper

Requires: ANTHROPIC_API_KEY environment variable
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from bs4 import BeautifulSoup

import anthropic
from dotenv import load_dotenv
load_dotenv()

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------

SCRAPER_DIR = Path(__file__).parent
DATA_DIR = SCRAPER_DIR / "data"
SEMESTERS_PATH = DATA_DIR / "01_semesters.json"

SCHEDULE_MAIN_URL = "https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main"
SCHEDULE_PROGRAMME_URL = "https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display"
SCHEDULE_DISPLAY_URL = "https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display1"
CONTENT_DISPLAY_URL = "https://wis.ntu.edu.sg/webexe/owa/AUS_SUBJ_CONT.main_display1"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/118.0.0.0 Safari/537.36"
    ),
    "Origin": "https://wish.wis.ntu.edu.sg",
    "Referer": "https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main",
}

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 16000

# Cache for programme fetches
_schedule_cache: Dict[str, List[Dict]] = {}
_content_cache: Dict[str, List[Dict]] = {}

# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

def tool_list_available_semesters() -> Dict:
    if not SEMESTERS_PATH.exists():
        return {"error": "01_semesters.json not found. Run step1_fetch_semesters.py first."}
    with SEMESTERS_PATH.open("r") as f:
        data = json.load(f)
    return {"semesters": data}


def tool_run_scraper(semester: str, workers: int = 4) -> Dict:
    cmd = [
        sys.executable, str(SCRAPER_DIR / "main.py"),
        "--semester", semester,
        "--workers", str(workers),
        "--refetch",
    ]
    print(f"\n[run_scraper] {' '.join(cmd)}")
    start = time.time()
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(SCRAPER_DIR))
    elapsed = time.time() - start
    if result.returncode != 0:
        return {
            "success": False,
            "error": result.stderr[-2000:] if result.stderr else "Unknown error",
            "elapsed_seconds": round(elapsed),
        }
    return {
        "success": True,
        "elapsed_seconds": round(elapsed),
        "stdout_tail": result.stdout[-500:] if result.stdout else "",
    }


def tool_load_data(semester: str) -> Dict:
    sem_key = semester.replace(";", "_")
    files = {
        "raw": DATA_DIR / f"02_courses_{sem_key}.json",
        "mdata": DATA_DIR / f"03_mdata_{sem_key}.json",
        "indexes": DATA_DIR / f"04_indexes_{sem_key}.json",
        "exams": DATA_DIR / f"05_exams_{sem_key}.json",
    }

    result: Dict[str, Any] = {"semester": semester, "files": {}}
    mdata: Optional[Dict] = None
    indexes: Optional[Dict] = None
    exams: Optional[Dict] = None

    for key, path in files.items():
        exists = path.exists()
        result["files"][key] = {"exists": exists, "path": str(path)}
        if exists and key != "raw":
            with path.open("r") as f:
                data = json.load(f)
            if key == "mdata":
                mdata = data
            elif key == "indexes":
                indexes = data
            elif key == "exams":
                exams = data

    if mdata is None:
        result["error"] = "03_mdata file missing — run the scraper first."
        return result

    result["course_count"] = len(mdata)

    courses_with_prereqs = [c for c, v in mdata.items() if v.get("prerequisite")]
    courses_multi_prog = [c for c, v in mdata.items() if len(v.get("searchKeys", [])) > 1]
    courses_with_desc = [c for c, v in mdata.items() if v.get("description")]
    all_courses = list(mdata.keys())

    compound_type_courses: List[str] = []
    if indexes:
        for course, indices in indexes.items():
            for index_slots in indices.values():
                for slot in index_slots:
                    if "/" in slot.get("type", ""):
                        compound_type_courses.append(course)
                        break
                else:
                    continue
                break

    result["sample_candidates"] = {
        "with_prerequisites": courses_with_prereqs[:10],
        "multi_programme": courses_multi_prog[:10],
        "with_description": courses_with_desc[:5],
        "compound_type": compound_type_courses[:5],
        "general": all_courses[:15],
    }
    result["index_count"] = sum(len(v) for v in indexes.values()) if indexes else 0
    result["exam_count"] = len(exams) if exams else 0

    return result


def tool_get_course_stored_data(semester: str, course_code: str) -> Dict:
    sem_key = semester.replace(";", "_")
    result: Dict[str, Any] = {"course_code": course_code}

    mdata_path = DATA_DIR / f"03_mdata_{sem_key}.json"
    if mdata_path.exists():
        with mdata_path.open("r") as f:
            mdata = json.load(f)
        result["mdata"] = mdata.get(course_code)

    indexes_path = DATA_DIR / f"04_indexes_{sem_key}.json"
    if indexes_path.exists():
        with indexes_path.open("r") as f:
            indexes = json.load(f)
        result["indexes"] = indexes.get(course_code, {})
        result["index_count"] = len(result["indexes"])

    exams_path = DATA_DIR / f"05_exams_{sem_key}.json"
    if exams_path.exists():
        with exams_path.open("r") as f:
            exams = json.load(f)
        result["exam"] = exams.get(course_code)

    # Also return the raw 02_courses entry for this course (pre-transformation)
    raw_path = DATA_DIR / f"02_courses_{sem_key}.json"
    if raw_path.exists():
        with raw_path.open("r") as f:
            raw = json.load(f)
        for prog, courses in raw.items():
            for course in courses:
                if course.get("course_code") == course_code:
                    result["raw_scraped"] = {"programme": prog, "course": course}
                    break
            if "raw_scraped" in result:
                break

    return result


def _fetch_schedule_for_programme(acadsem: str, programme: str) -> List[Dict]:
    cache_key = f"{acadsem}::{programme}"
    if cache_key in _schedule_cache:
        return _schedule_cache[cache_key]

    from step2_scrape_courses import scrape_programme_schedule
    try:
        courses = scrape_programme_schedule(acadsem, programme)
        _schedule_cache[cache_key] = courses
        return courses
    except Exception as exc:
        print(f"[fetch_schedule] Error: {exc}")
        return []


def _fetch_content_for_programme(acadsem: str, programme: str) -> List[Dict]:
    cache_key = f"{acadsem}::{programme}"
    if cache_key in _content_cache:
        return _content_cache[cache_key]

    from step2b_scrape_content import scrape_programme_content
    try:
        courses = scrape_programme_content(acadsem, programme)
        _content_cache[cache_key] = courses
        return courses
    except Exception as exc:
        print(f"[fetch_content] Error: {exc}")
        return []


def tool_fetch_live_schedule(acadsem: str, programme: str, course_code: str) -> Dict:
    courses = _fetch_schedule_for_programme(acadsem, programme)

    for course in courses:
        if course.get("course_code") == course_code:
            lines = [
                f"{course['course_code']}  {course.get('course_title', '?')}  {course.get('credits', '?')} AU"
            ]
            for k, v in (course.get("fields") or {}).items():
                lines.append(f"{k}: {v}")
            lines.append("")
            lines.append("INDEX  TYPE  GROUP  DAY  TIME  VENUE  REMARK")
            for s in course.get("schedules") or []:
                lines.append(
                    f"{s.get('index','')}  {s.get('type','')}  {s.get('group','')}  "
                    f"{s.get('day','')}  {s.get('time','')}  {s.get('venue','')}  {s.get('remark','')}"
                )
            return {
                "found": True,
                "text_dump": "\n".join(lines),
                "parsed": course,
            }

    return {
        "found": False,
        "course_code": course_code,
        "programme": programme,
        "courses_in_programme": len(courses),
        "note": "Course not found in this programme. Try a different programme from mdata.searchKeys.",
    }


def tool_fetch_live_content(acadsem: str, programme: str, course_code: str) -> Dict:
    courses = _fetch_content_for_programme(acadsem, programme)

    for course in courses:
        if course.get("course_code") == course_code:
            lines = [f"{course['course_code']}  {course.get('course_title', '?')}"]
            for k, v in (course.get("fields") or {}).items():
                lines.append(f"{k}: {v}")
            if course.get("description"):
                lines.append(f"Description: {course['description'][:400]}")
            return {
                "found": True,
                "text_dump": "\n".join(lines),
                "parsed": course,
            }

    return {
        "found": False,
        "course_code": course_code,
        "programme": programme,
        "courses_in_programme": len(courses),
    }


_findings: List[Dict] = []
_final_result: Optional[Dict] = None


def tool_report_finding(
    course_code: str,
    severity: str,
    category: str,
    issue: str,
    portal_value: str = "",
    scraped_value: str = "",
) -> Dict:
    finding = {
        "course_code": course_code,
        "severity": severity,
        "category": category,
        "issue": issue,
    }
    if portal_value:
        finding["portal_value"] = portal_value
    if scraped_value:
        finding["scraped_value"] = scraped_value
    _findings.append(finding)
    return {"logged": True, "total_findings": len(_findings)}


def tool_finish(verdict: str, summary: str) -> Dict:
    global _final_result
    _final_result = {"verdict": verdict, "summary": summary}
    return {"done": True}


# ---------------------------------------------------------------------------
# Tool dispatch + schema
# ---------------------------------------------------------------------------

TOOLS_SCHEMA = [
    {
        "name": "list_available_semesters",
        "description": "List available semesters from disk (01_semesters.json).",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "run_scraper",
        "description": "Run main.py --refetch for the given semester to generate fresh data files.",
        "input_schema": {
            "type": "object",
            "properties": {
                "semester": {"type": "string", "description": "e.g. '2025;2'"},
                "workers": {"type": "integer", "description": "Parallel workers (default 4)"},
            },
            "required": ["semester"],
        },
    },
    {
        "name": "load_data",
        "description": "Load all scraped data files for a semester. Returns stats + sample course codes for selection.",
        "input_schema": {
            "type": "object",
            "properties": {
                "semester": {"type": "string"},
            },
            "required": ["semester"],
        },
    },
    {
        "name": "get_course_stored_data",
        "description": "Get all stored data for a course: mdata, indexes, exams, and the raw pre-transformation scraped data.",
        "input_schema": {
            "type": "object",
            "properties": {
                "semester": {"type": "string"},
                "course_code": {"type": "string"},
            },
            "required": ["semester", "course_code"],
        },
    },
    {
        "name": "fetch_live_schedule",
        "description": (
            "Fetch fresh schedule data live from NTU portal for a course. "
            "Returns text_dump (human-readable) and parsed (raw extracted dict). "
            "Use a programme code from mdata.searchKeys."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "acadsem": {"type": "string", "description": "e.g. '2025;2'"},
                "programme": {"type": "string", "description": "e.g. 'CSC;;1;F' from mdata.searchKeys"},
                "course_code": {"type": "string"},
            },
            "required": ["acadsem", "programme", "course_code"],
        },
    },
    {
        "name": "fetch_live_content",
        "description": "Fetch fresh content data live from NTU content portal for a course.",
        "input_schema": {
            "type": "object",
            "properties": {
                "acadsem": {"type": "string"},
                "programme": {"type": "string"},
                "course_code": {"type": "string"},
            },
            "required": ["acadsem", "programme", "course_code"],
        },
    },
    {
        "name": "report_finding",
        "description": "Log a validation finding. Call for each issue AND for each course that passes (severity='ok').",
        "input_schema": {
            "type": "object",
            "properties": {
                "course_code": {"type": "string"},
                "severity": {"type": "string", "enum": ["ok", "warning", "error"]},
                "category": {"type": "string", "enum": ["mdata", "indexes", "exams", "extraction", "schema"]},
                "issue": {"type": "string"},
                "portal_value": {"type": "string", "description": "What the live portal shows"},
                "scraped_value": {"type": "string", "description": "What the scraper produced"},
            },
            "required": ["course_code", "severity", "category", "issue"],
        },
    },
    {
        "name": "finish",
        "description": "Signal validation complete. Required to end the agent loop.",
        "input_schema": {
            "type": "object",
            "properties": {
                "verdict": {"type": "string", "enum": ["PASS", "FAIL", "WARNING"]},
                "summary": {"type": "string", "description": "2-3 sentence summary of findings"},
            },
            "required": ["verdict", "summary"],
        },
    },
]


def execute_tool(name: str, inputs: Dict) -> Any:
    if name == "list_available_semesters":
        return tool_list_available_semesters()
    elif name == "run_scraper":
        return tool_run_scraper(inputs["semester"], inputs.get("workers", 4))
    elif name == "load_data":
        return tool_load_data(inputs["semester"])
    elif name == "get_course_stored_data":
        return tool_get_course_stored_data(inputs["semester"], inputs["course_code"])
    elif name == "fetch_live_schedule":
        return tool_fetch_live_schedule(inputs["acadsem"], inputs["programme"], inputs["course_code"])
    elif name == "fetch_live_content":
        return tool_fetch_live_content(inputs["acadsem"], inputs["programme"], inputs["course_code"])
    elif name == "report_finding":
        return tool_report_finding(
            inputs["course_code"],
            inputs["severity"],
            inputs["category"],
            inputs["issue"],
            inputs.get("portal_value", ""),
            inputs.get("scraped_value", ""),
        )
    elif name == "finish":
        return tool_finish(inputs["verdict"], inputs["summary"])
    else:
        return {"error": f"Unknown tool: {name}"}


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a data quality validation agent for the NTU (Nanyang Technological University) course scraper.

Your job is to validate that scraped course data files accurately reflect what is currently on the NTU portals.
The scraper pipeline can break at multiple points:
- Step 2: HTML parsing from schedule portal (breaks if NTU changes HTML structure)
- Step 2b: HTML parsing from content portal (same risk)
- Step 3: Raw → mdata transformation (prerequisite parsing, field mapping, title normalization)
- Step 4: Raw → indexes transformation (day conversion, duration calculation, type normalization)

## Validation Workflow

1. If data not yet loaded, call load_data() first.
2. Pick 15-20 courses from sample_candidates covering all categories:
   - with_prerequisites: tests prerequisite AND/OR parsing in step3
   - multi_programme: tests deduplication and searchKeys
   - with_description: tests content portal extraction
   - compound_type: tests type normalization (LEC/STUDIO → LEC in step4)
   - general: baseline coverage
3. For each selected course:
   a. Call get_course_stored_data() — see what scraper produced (raw + mdata + indexes)
   b. Call fetch_live_schedule() with semester and one programme from mdata.searchKeys
   c. If course has description or gradeType in mdata, also call fetch_live_content()
   d. Compare carefully (see checklist below)
   e. Call report_finding() — once per issue, or severity="ok" if course passes
4. After all courses, call finish() with verdict and summary.

## Comparison Checklist

**Title:** Portal title vs mdata.title — allow .title() normalization differences (e.g. "21ST CENTURY" → "21St Century"), flag if fundamentally different.

**AU:** portal credits vs mdata.au (as float vs string — "3.0" == 3.0 ✓).

**Prerequisites:** raw portal "Prerequisite:" field vs mdata.prerequisite nested array.
- Portal: "A AND B OR C" → mdata should parse as [["A", "B"], ["C"]] (AND groups, OR between groups).
- Flag if structure doesn't match the logic.

**Indexes:** Every index number in portal schedules should appear in stored indexes.
- Portal index "10001" absent from stored indexes → error.
- Extra indexes in stored that aren't in portal → error.

**Schedule slots:** For each index, verify day (MON→1, TUE→2, ... SUN→7), time (HHMM-HHMM), venue, type match.
- day=0 in stored indexes → warning (known portal data issue, not a scraper bug).

**Duration:** Verify ceil((end_minutes - start_minutes) / 30). Example: 1330-1620 = 170min → ceil(170/30) = 6.

**Type normalization:** "LEC/STUDIO" in portal → "LEC" in stored indexes is INTENTIONAL (step4 takes prefix before /). Report as ok.

**Content fields:** gradeType, description, notAvailableToProgramme — verify they're present and non-empty when portal shows them.

**New or unknown portal fields:** Treat any newly observed row, column, label, header, field key, schedule attribute, or content attribute as a validation signal. Do not dismiss extra portal data just because it is not in the current scraper schema.
- If the live portal shows an additional course-level field, content field, table column, schedule column, or row type that is absent from the stored/raw scraper output, report it with category="schema".
- If `fetch_live_schedule()` or `fetch_live_content()` returns parsed fields that are not represented in raw_scraped, mdata, indexes, or exams, report them as warning/error depending on whether the data appears user-facing or required.
- Flag unknown data even when existing known fields still match. The goal is to catch future NTU portal changes early so the scraper can be updated to account for new data instead of silently ignoring it.
- Include the exact portal label/header/key and an example value in portal_value when possible.

## Severity Guide
- error: data is wrong or missing (wrong day number, missing index, prerequisite parsed incorrectly), or a newly observed required-looking portal field/column/row is missing from scraper output and affects course metadata, indexes, exams, eligibility, or scheduling
- warning: minor issue, known quirk, or newly observed optional field/schema surface that may need scraper support
- ok: course validates correctly

## Known acceptable differences
- Title: .title() normalization from step3 (21st → 21St, API → Api)
- Type: "LEC/STUDIO" → "LEC" (step4 takes prefix, intentional)
- day=0 slots: portal data issue, filtered by server — flag as warning only
- Courses with 0 indexes: may be valid (distance learning, non-scheduled)
- Programme fetch returning 0 courses: CRITICAL — means portal HTML may have changed
- Extra live portal fields, rows, or columns are NOT acceptable differences by default. Report them under category="schema" so they can be evaluated.
"""


# ---------------------------------------------------------------------------
# Agent loop
# ---------------------------------------------------------------------------

def run_agent(semester: str, workers: int, skip_scrape: bool, sample: int) -> int:
    global _findings, _final_result
    _findings = []
    _final_result = None
    _schedule_cache.clear()
    _content_cache.clear()

    client = anthropic.Anthropic()

    user_message = (
        f"Validate NTU scraper data for semester: {semester}\n\n"
        f"sample_size: {sample} courses\n"
        f"skip_scrape: {skip_scrape}\n\n"
    )
    if skip_scrape:
        user_message += "Do NOT call run_scraper — validate existing files only.\n"
    else:
        user_message += f"Start by calling run_scraper(semester='{semester}', workers={workers}), then load_data and begin validation.\n"

    messages: List[Dict] = [{"role": "user", "content": user_message}]

    print(f"\n{'═' * 56}")
    print(f"  NTU Scraper Validation Agent")
    print(f"  Semester: {semester}  |  Model: {MODEL}")
    print(f"{'═' * 56}\n")

    start_time = time.time()

    while _final_result is None:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
            tools=TOOLS_SCHEMA,
            messages=messages,
        )

        messages.append({"role": "assistant", "content": response.content})

        # Print any text the agent outputs
        for block in response.content:
            if hasattr(block, "type") and block.type == "text" and block.text.strip():
                print(f"\n[Agent] {block.text.strip()}")

        if response.stop_reason == "end_turn":
            print("\n[Agent] Stopped without calling finish().")
            break

        if response.stop_reason != "tool_use":
            break

        tool_results = []
        for block in response.content:
            if hasattr(block, "type") and block.type == "tool_use":
                input_preview = json.dumps(block.input, ensure_ascii=False)[:120]
                print(f"\n[Tool] {block.name}({input_preview})")
                result = execute_tool(block.name, block.input)
                result_preview = json.dumps(result, ensure_ascii=False)[:200]
                print(f"    → {result_preview}")
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result, ensure_ascii=False),
                })

        if tool_results:
            messages.append({"role": "user", "content": tool_results})

        if _final_result is not None:
            break

    elapsed = time.time() - start_time

    # Print report
    print(f"\n{'═' * 56}")
    print(f"  NTU Scraper Validation Report — {semester}")
    print(f"  Elapsed: {int(elapsed // 60)}m {int(elapsed % 60)}s")
    print(f"{'═' * 56}\n")

    ok_count = sum(1 for f in _findings if f["severity"] == "ok")
    warn_count = sum(1 for f in _findings if f["severity"] == "warning")
    error_count = sum(1 for f in _findings if f["severity"] == "error")

    for finding in _findings:
        if finding["severity"] == "ok":
            continue
        icon = {"warning": "⚠", "error": "✗"}.get(finding["severity"], "?")
        line = f"  {icon} {finding['course_code']:12} [{finding['category']}] {finding['issue']}"
        if finding.get("portal_value") or finding.get("scraped_value"):
            line += f"\n       portal:  {finding.get('portal_value', '')}"
            line += f"\n       scraped: {finding.get('scraped_value', '')}"
        print(line)

    if not _findings:
        print("  No findings logged.")

    print()
    print(f"  Checked: {ok_count + warn_count + error_count} findings  "
          f"(✓ {ok_count}  ⚠ {warn_count}  ✗ {error_count})")
    print()

    if _final_result:
        verdict = _final_result["verdict"]
        icon = {"PASS": "✓", "WARNING": "⚠", "FAIL": "✗"}.get(verdict, "?")
        print(f"{'─' * 56}")
        print(f"  VERDICT: {icon} {verdict}")
        print(f"  {_final_result['summary']}")
        print(f"{'═' * 56}")

    if error_count > 0 or (_final_result and _final_result["verdict"] == "FAIL"):
        return 1
    return 0


# ---------------------------------------------------------------------------
# Semester resolution
# ---------------------------------------------------------------------------

def resolve_semester(arg: Optional[str]) -> str:
    if arg in (None, "latest"):
        if not SEMESTERS_PATH.exists():
            print("Fetching semester list from NTU portal...")
            subprocess.run(
                [sys.executable, str(SCRAPER_DIR / "step1_fetch_semesters.py")],
                cwd=str(SCRAPER_DIR),
                check=True,
            )
        with SEMESTERS_PATH.open("r") as f:
            semesters = json.load(f)
        if not semesters:
            raise ValueError("No semesters found.")
        latest = semesters[0]
        print(f"Using latest semester: {latest['name']} ({latest['code']})")
        return latest["code"]
    return arg


# ---------------------------------------------------------------------------
# Scrape mode selection
# ---------------------------------------------------------------------------

def _data_files_for_semester(semester: str) -> Dict[str, Path]:
    sem_key = semester.replace(";", "_")
    return {
        "raw": DATA_DIR / f"02_courses_{sem_key}.json",
        "mdata": DATA_DIR / f"03_mdata_{sem_key}.json",
        "indexes": DATA_DIR / f"04_indexes_{sem_key}.json",
        "exams": DATA_DIR / f"05_exams_{sem_key}.json",
    }


def prompt_skip_scrape(semester: str) -> bool:
    files = _data_files_for_semester(semester)
    existing = [name for name, path in files.items() if path.exists()]
    missing = [name for name, path in files.items() if not path.exists()]

    print()
    if existing:
        print(f"Found existing data for {semester}: {', '.join(existing)}")
    if missing:
        print(f"Missing data for {semester}: {', '.join(missing)}")

    if missing:
        prompt = "Run scraper before validation? [Y/n]: "
        default_run_scraper = True
    else:
        prompt = "Reuse existing files and skip scraping? [Y/n]: "
        default_run_scraper = False

    while True:
        answer = input(prompt).strip().lower()
        if not answer:
            return not default_run_scraper
        if answer in ("y", "yes"):
            return not default_run_scraper
        if answer in ("n", "no"):
            return default_run_scraper
        print("Please answer y or n.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Claude-powered validation agent for NTU scraper data."
    )
    parser.add_argument("--semester", metavar="YYYY;S",
                        help="Semester code (e.g. '2025;2') or 'latest'. Uses latest if omitted.")
    parser.add_argument("--workers", type=int, default=4, metavar="N",
                        help="Parallel workers for scraper (default: 4).")
    parser.add_argument("--sample", type=int, default=15, metavar="N",
                        help="Number of courses to validate (default: 15).")
    scrape_group = parser.add_mutually_exclusive_group()
    scrape_group.add_argument("--skip-scrape", action="store_true",
                              help="Skip re-fetching; validate existing files only.")
    scrape_group.add_argument("--run-scraper", action="store_true",
                              help="Run the scraper before validation without prompting.")
    args = parser.parse_args()

    semester = resolve_semester(args.semester)
    if args.skip_scrape:
        skip_scrape = True
    elif args.run_scraper:
        skip_scrape = False
    elif sys.stdin.isatty():
        skip_scrape = prompt_skip_scrape(semester)
    else:
        skip_scrape = False

    exit_code = run_agent(semester, args.workers, skip_scrape, args.sample)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
