# NTU Course Scraper

Scrapes course schedule data from the [NTU class schedule portal](https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main) and converts it into a structured mdata format.

## Pipeline

```
Step 1                     Step 2                          Step 3                        Step 4                         Step 5
fetch semesters     →      scrape courses          →       convert to mdata      →       convert to indexes       →  convert to exams
                           (per semester, per programme)

data/01_semesters.json  →  data/02_courses_YYYY_S.json  →  data/03_mdata_YYYY_S.json  →  data/04_indexes_YYYY_S.json  →  data/05_exams_YYYY_S.json
```

## Setup

```bash
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install requests beautifulsoup4
```

---

## Usage

### Run the full pipeline (`main.py`)

The recommended way to run everything end-to-end.

By default, existing data files are reused — steps are skipped if their output already exists. Use `--refetch` to ignore cached data and re-run from scratch.

> **Note:** Always quote semester codes in the shell — the semicolon (`;`) is a shell command separator.
> Use `"2025;2"` not `2025;2`.

```bash
# Interactive — prompts you to pick a semester
python3 main.py

# Scrape a specific semester
python3 main.py --semester "2025;2"

# Scrape with parallel workers (faster; default is 1)
python3 main.py --semester "2025;2" --workers 4

# Scrape all available semesters
python3 main.py --semester all

# Scrape all semesters from a given year onwards (e.g. all of 2025)
python3 main.py --semester all --min-year 2025

# Scrape from a specific semester onwards (e.g. 2025 Sem 2 and newer)
python3 main.py --semester all --from "2025;2"

# Re-fetch everything, ignoring any cached data
python3 main.py --semester "2025;2" --refetch

# Re-fetch with parallel workers
python3 main.py --semester "2025;2" --workers 4 --refetch

# Scrape all semesters from 2025 Sem 2 onwards, with parallel workers
python3 main.py --semester all --from "2025;2" --workers 10

# Scrape all semesters from 2025 onwards and force re-fetch
python3 main.py --semester all --min-year 2025 --workers 4 --refetch

# Scrape all semesters (everything, from scratch)
python3 main.py --semester all --refetch --workers 4
```

**Options:**

| Flag | Description |
|------|-------------|
| `--semester "YYYY;S"` | Semester to scrape. Use `all` for every available semester. Prompts interactively if omitted. |
| `--workers N` | Number of parallel threads (default: `1`). Higher values are faster but put more load on NTU's servers. |
| `--min-year YYYY` | Only scrape semesters from this year onwards. Only applies with `--semester all`. |
| `--from "YYYY;S"` | Only scrape this semester and newer. Only applies with `--semester all`. Takes precedence over `--min-year`. |
| `--refetch` | Ignore cached data and re-run all steps from scratch. |
| `--pretty` | Pretty-print JSON output with indentation (default: minified). |

---

### Run individual steps

Each step can also be run on its own.

#### Step 1 — Fetch available semesters

Fetches the list of all academic semesters from the NTU portal.

```bash
python3 step1_fetch_semesters.py

# Pretty-print the output
python3 step1_fetch_semesters.py --pretty
```

Output: `data/01_semesters.json`

```json
[
  { "code": "2025;2", "name": "Acad Yr 2025 Semester 2" },
  { "code": "2025;1", "name": "Acad Yr 2025 Semester 1" },
  ...
]
```

---

#### Step 2 — Scrape courses

Scrapes all courses for a given semester across every programme.

```bash
# Specify semester directly
python3 step2_scrape_courses.py "2025;2"

# With parallel workers
python3 step2_scrape_courses.py "2025;2" --workers 4

# Pretty-print the output
python3 step2_scrape_courses.py "2025;2" --pretty

# Interactive selection (reads from data/01_semesters.json)
python3 step2_scrape_courses.py
```

Output: `data/02_courses_2025_2.json`

```json
{
  "CSC;;1;F": [
    {
      "course_code": "CSC1010",
      "course_title": "Introduction to Programming",
      "credits": 3.0,
      "prerequisite": null,
      "remark": null,
      "schedules": [
        { "index": "10001", "type": "LEC", "group": "1", "day": "MON", "time": "0830-0930", "venue": "LT1", "remark": "" }
      ]
    }
  ]
}
```

---

#### Step 3 — Convert to mdata

Converts a raw courses file into a deduplicated, course-keyed mdata format.

```bash
# Auto-detects the most recently modified 02_courses_*.json
python3 step3_convert_mdata.py

# Specify input explicitly
python3 step3_convert_mdata.py data/02_courses_2025_2.json

# Specify both input and output
python3 step3_convert_mdata.py data/02_courses_2025_2.json data/03_mdata_2025_2.json

# Pretty-print the output
python3 step3_convert_mdata.py data/02_courses_2025_2.json --pretty
```

Output: `data/03_mdata_2025_2.json`

```json
{
  "CSC1010": {
    "searchKeys": ["CSC;;1;F", "CSC;;2;F"],
    "code": "CSC1010",
    "title": "Introduction To Programming",
    "au": "3.0",
    "prerequisite": [["CS0001"]],
    "notAvailableToProgramme": "Not available to CS students who have taken CSC9001"
  }
}
```

Courses that appear in multiple programmes are merged — all programme codes are collected into `searchKeys`.

---

#### Step 4 — Convert to indexes

Converts a raw courses file into a per-course, per-index schedule mapping.

```bash
# Auto-detects the most recently modified 02_courses_*.json
python3 step4_convert_indexes.py

# Specify input explicitly
python3 step4_convert_indexes.py data/02_courses_2025_2.json

# Specify both input and output
python3 step4_convert_indexes.py data/02_courses_2025_2.json data/04_indexes_2025_2.json

# Pretty-print the output
python3 step4_convert_indexes.py data/02_courses_2025_2.json --pretty
```

Output: `data/04_indexes_2025_2.json`

```json
{
  "CSC1010": {
    "10001": [
      { "key": "10001", "type": "LEC", "group": "1", "day": 1, "time": "0830-0930", "venue": "LT1", "remarks": "", "duration": 2 },
      { "key": "10001", "type": "TUT", "group": "T1", "day": 3, "time": "1030-1120", "venue": "TR1", "remarks": "", "duration": 2 }
    ]
  }
}
```

Each slot's `day` is an integer (Mon=1 … Sun=7) and `duration` is the number of 30-minute units the class occupies.

---

#### Step 5 — Convert exams

Converts exam CSV files in `data/exams` into per-semester exam JSON.

CSV naming convention:
- `data/exams/exams-YYYY-YYYY-s1.csv` for Semester 1
- `data/exams/exams-YYYY-YYYY-s2.csv` for Semester 2

```bash
# Convert exams for a semester
python3 step5_convert_exams.py "2025;2"

# Specify both semester and output path
python3 step5_convert_exams.py "2025;2" data/05_exams_2025_2.json

# Pretty-print the output
python3 step5_convert_exams.py "2025;2" --pretty
```

Output: `data/05_exams_2025_2.json`

```json
{
  "SC2001": {
    "date": "24 April 2026",
    "day": 5,
    "start_time": "9.00 am",
    "end_time": "11.00 am",
    "key": "SC2001",
    "name": "ALGORITHM DESIGN & ANALYSIS",
    "duration": 4
  }
}
```

---

## Data files

| File | Description |
|------|-------------|
| `data/01_semesters.json` | All available academic semesters |
| `data/02_courses_YYYY_S.json` | Raw course data for a semester, keyed by programme |
| `data/03_mdata_YYYY_S.json` | Converted mdata, keyed by course code |
| `data/04_indexes_YYYY_S.json` | Schedule indexes keyed by course code → index number |
| `data/05_exams_YYYY_S.json` | Exam timetable keyed by course code |

> **Note:** Data files are not committed to version control. Run the pipeline to generate them.

## Semester codes

Semester codes follow the format `YYYY;S` where `YYYY` is the **academic year** (not the calendar year):

| Code | Meaning | When it runs |
|------|---------|-------------|
| `2025;1` | Academic Year 2025 Semester 1 | Aug – Nov 2025 |
| `2025;2` | Academic Year 2025 Semester 2 | Jan – Apr 2026 |
| `2025;S` | Academic Year 2025 Special Term (Summer) | May – Jun 2026 |
| `2025;T` | Academic Year 2025 Special Term (trimester) | May – Aug 2026 |
