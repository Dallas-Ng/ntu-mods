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
pip install -r requirements.txt
```

### Optional: validation agent

`compare_agent.py` cross-checks scraped output against the live NTU portal using Claude. Requires an `ANTHROPIC_API_KEY`:

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
```

Not needed for the core scraping pipeline (steps 1–5).

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

| Flag                  | Description                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `--semester "YYYY;S"` | Semester to scrape. Use `all` for every available semester. Prompts interactively if omitted.                |
| `--workers N`         | Number of parallel threads (default: `1`). Higher values are faster but put more load on NTU's servers.      |
| `--min-year YYYY`     | Only scrape semesters from this year onwards. Only applies with `--semester all`.                            |
| `--from "YYYY;S"`     | Only scrape this semester and newer. Only applies with `--semester all`. Takes precedence over `--min-year`. |
| `--refetch`           | Ignore cached data and re-run all steps from scratch.                                                        |
| `--pretty`            | Pretty-print JSON output with indentation (default: minified).                                               |

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
        {
          "index": "10001",
          "type": "LEC",
          "group": "1",
          "day": "MON",
          "time": "0830-0930",
          "venue": "LT1",
          "remark": ""
        }
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
      {
        "key": "10001",
        "type": "LEC",
        "group": "1",
        "day": 1,
        "time": "0830-0930",
        "venue": "LT1",
        "remarks": "",
        "duration": 2
      },
      {
        "key": "10001",
        "type": "TUT",
        "group": "T1",
        "day": 3,
        "time": "1030-1120",
        "venue": "TR1",
        "remarks": "",
        "duration": 2
      }
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

| File                          | Description                                          |
| ----------------------------- | ---------------------------------------------------- |
| `data/01_semesters.json`      | All available academic semesters                     |
| `data/02_courses_YYYY_S.json` | Raw course data for a semester, keyed by programme   |
| `data/03_mdata_YYYY_S.json`   | Converted mdata, keyed by course code                |
| `data/04_indexes_YYYY_S.json` | Schedule indexes keyed by course code → index number |
| `data/05_exams_YYYY_S.json`   | Exam timetable keyed by course code                  |

> **Note:** Data files are not committed to version control. Run the pipeline to generate them.

## Semester codes

Semester codes follow the format `YYYY;S` where `YYYY` is the **academic year** (not the calendar year):

| Code     | Meaning                                     | When it runs   |
| -------- | ------------------------------------------- | -------------- |
| `2025;1` | Academic Year 2025 Semester 1               | Aug – Nov 2025 |
| `2025;2` | Academic Year 2025 Semester 2               | Jan – Apr 2026 |
| `2025;S` | Academic Year 2025 Special Term (Summer)    | May – Jun 2026 |
| `2025;T` | Academic Year 2025 Special Term (trimester) | May – Aug 2026 |

---

## Publishing

Running the pipeline only writes files under `data/` — nothing is live until it's published. Publishing writes to two independent places, and both are needed:

| Step                   | Publishes to                                                        | Command                                     |
| ----------------------- | -------------------------------------------------------------------- | -------------------------------------------- |
| `--load`                | Cloudflare D1 (the on-demand historic-snapshot route reads this live) | `python main.py --semester "2025;2" --load` |
| `python stepfinal_upsync.py` | `src/data/api` (prerendered pages and the client's bulk JSON — everything else) | `python stepfinal_upsync.py`                |

```bash
# Full refresh, then publish to both
python main.py --semester "2025;2" --refetch --workers 4 --load
python stepfinal_upsync.py

# Check what a load would do without touching D1
python main.py --semester "2025;2" --load --dry-run

# Publish only exams, leaving courses alone
python main.py --semester "2025;2" --load --scope exams

# Preview what stepfinal_upsync would copy, without writing
python stepfinal_upsync.py --dry-run
```

A load is a `DELETE` of that scope's rows followed by `INSERT`s, applied as one file through `wrangler d1 execute`, which is atomic — a failed load leaves the semester exactly as it was. Replace rather than merge, because merging cannot express deletion: a cancelled class index would otherwise linger forever.

Before applying, the loader compares row counts against the previous load recorded in the `loads` table and refuses a drop of more than 20% without `--force`. An expired session or a portal error page yields zero courses, and a blind replace would wipe the semester.

`stepfinal_upsync.py` copies scraper output straight into `src/data/api/{metadata,indexes,exams}`:

| Scraper output                        | Production destination              |
| ------------------------------------- | ----------------------------------- |
| `scraper/data/03_mdata_YYYY_S.json`   | `src/data/api/metadata/YYYY_S.json` |
| `scraper/data/04_indexes_YYYY_S.json` | `src/data/api/indexes/YYYY_S.json`  |
| `scraper/data/05_exams_YYYY_S.json`   | `src/data/api/exams/YYYY_S.json`    |

Its changes must be committed and pushed — that push is what triggers the site rebuild that actually shows the new data. `--load` on its own never does. `src/data/api/semesters.json` isn't copied by this script — `scripts/build-static-data.mts` generates it from the metadata files at build time, so "the current semester" means the newest one that actually has offerings loaded, not whatever the portal happens to list.

After publishing, validate from the repo root:

```bash
yarn db:verify   # confirms D1 matches src/data/api exactly, every module, every semester
```

## Maintenance

Tasks for keeping data current, in the order they need doing.

### Every semester

1. Run the pipeline for the new semester and publish both destinations (see [Publishing](#publishing)):
   ```bash
   python main.py --semester "2026;1" --load
   python stepfinal_upsync.py
   ```
2. Add the exam timetable once NTU releases it. Download the CSV and place it at:
   ```
   data/exams/exams-YYYY-YYYY-sX.csv   # e.g. exams-2025-2026-s2.csv
   ```
   Then re-run step 5 and publish again:
   ```bash
   python step5_convert_exams.py "2026;1"
   python main.py --semester "2026;1" --load --scope exams
   python stepfinal_upsync.py
   ```

Commit and push `src/data/api` after each publish — nothing outside the on-demand snapshot route updates until that push lands.

## Data Invariants

Correctness rules to check any `03_mdata` / `04_indexes` / `05_exams` triplet against:

**`03_mdata_YYYY_S.json` (module metadata)**

- Every entry has `code`, `title`, `au`, `searchKeys`
- `au` parses as float > 0
- `searchKeys` is a non-empty list of strings
- `prerequisite` is `null` OR `list[list[str]]` (outer = AND, inner = OR)
- Optional fields (`description`, `gradeType`, `maintainingDept`, `notAvailableToProgramme`, etc.) are strings when present, never empty string

**`04_indexes_YYYY_S.json` (schedule slots)**

- Structure: `{ "COURSE_CODE": { "INDEX_NUM": [ slot, ... ] } }`
- Every `slot` has: `key` (= index number), `type`, `group`, `day`, `time`, `venue`, `remarks`, `duration`
- `day` is int 1–7 (Mon=1, Sun=7). `day=0`/missing means no scheduled day (e.g. distance learning) — valid, but the settings preview's random-sample generator (`scripts/build-static-data.mts`) skips these, so flag an unexpectedly high count
- `time` matches `HHMM-HHMM`, start < end, both in 0000–2359 range
- `duration` = `ceil((end_minutes - start_minutes) / 30)` where minutes = HH\*60+MM
- `type` is one of: `LEC`, `LAB`, `SEM`, `TUT`, `DES`, `PRJ`
- No duplicate `(course_code, index, type, day, time)` tuple within the file
- Every course code in indexes must exist in `03_mdata`

**`05_exams_YYYY_S.json` (exam timetable)**

- Structure: `{ "COURSE_CODE": { date, day, start_time, end_time, key, name, duration? } }`
- `day` is int 1–7
- `start_time` / `end_time` match pattern like `"9.00 am"` or `"2.30 pm"`
- `duration` (if present) = ceil(exam_length_minutes / 30)
- Every exam key must exist in `03_mdata`

**Cross-file consistency**

- Modules in `05_exams` that are absent from `03_mdata` → flag as orphaned exam entries
- Modules in `03_mdata` with zero indexes in `04_indexes` → may be valid (distance learning) but worth noting

## Known Gotchas

- **Shell quoting:** Always quote semester codes: `"2025;2"` not `2025;2` (`;` is a shell separator)
- **Exam CSV required for Step 5:** Place `data/exams/exams-YYYY-YYYY-s{1|2}.csv` before running Step 5 or the exam file will be empty
- **Special terms (S/T):** Far fewer courses than S1/S2 — a low course count is expected, not an error
- **Multi-programme modules:** Same course appears under multiple programme codes; `searchKeys` collects them all. `03_mdata` deduplicates — one entry per `course_code`
- **`day=0`/missing-day slots:** Real and valid (see Data Invariants above) — don't treat a nonzero count of these as a bug on its own
- **`02b_content` step:** Adds `description`, `gradeType`, and restriction fields to mdata. If Step 2b was skipped or failed, these fields will be missing from `03_mdata`
- **`--load` publishes to D1 only:** it does not touch `src/data/api` — always follow with `stepfinal_upsync.py` and a commit, or the rest of the site won't show the new data (see [Publishing](#publishing))
