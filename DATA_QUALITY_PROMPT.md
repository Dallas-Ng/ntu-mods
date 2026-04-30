# NTU Mods — Data Quality Check Agent Prompt

Copy and paste everything below this line into a new Claude conversation.

---

You are a data quality agent for the **NTU Mods** project — a Next.js app that serves NTU course schedule data to students. Your job is to inspect the pipeline output for a specific semester and report on data quality and correctness.

## Step 1 — Orient yourself

Read `scraper/README.md` (specifically the **Claude Agent Quick Reference** section at the bottom). It documents:

- The pipeline steps and file naming conventions
- The canonical data invariants you must check
- Known edge cases and gotchas

## Step 2 — Target semester

Check data for semester: **`YYYY;S`**
_(Replace `YYYY;S` with the semester code, e.g. `2025;2`)_

The three files to inspect are:

- `scraper/data/03_mdata_YYYY_S.json` — module metadata
- `scraper/data/04_indexes_YYYY_S.json` — schedule slots
- `scraper/data/05_exams_YYYY_S.json` — exam timetable

_(Replace `YYYY_S` with underscored form, e.g. `2025_2`)_

## Step 3 — Checks to run

Run all checks from the **Data invariants** section of `scraper/README.md`. Specifically:

### A. Module metadata (`03_mdata`)

1. All required fields present: `code`, `title`, `au`, `searchKeys`
2. `au` parses as float > 0
3. `searchKeys` is non-empty list
4. `prerequisite` shape: `null` or `list[list[str]]`
5. No empty-string values on optional text fields

### B. Schedule slots (`04_indexes`)

1. `day` is int 1–7 for every slot — flag any `day=0` entries with course + index
2. `time` matches `HHMM-HHMM`, start < end
3. `duration` is correct: `ceil((end_min - start_min) / 30)` — sample 20 random slots
4. `type` is one of: LEC, LAB, SEM, TUT, DES, PRJ
5. No duplicate `(course_code, index, type, day, time)` tuples
6. Every course code in indexes exists in mdata

### C. Exam timetable (`05_exams`)

1. Every exam key exists in mdata
2. `day` is int 1–7
3. `start_time` / `end_time` are parseable time strings
4. `duration` (if present) matches computed exam length

### D. Cross-file stats (sanity numbers)

- Total modules in mdata
- Total modules with at least one index
- Total modules with no indexes (list up to 10 examples)
- Total modules with exam entries
- Total modules in mdata but missing from exams (expected — many modules have no exam)

## Step 4 — Output format

Report findings as a markdown table followed by details for any WARN or FAIL:

```
| Category | Status | Count | Note |
|----------|--------|-------|------|
| A1 Required fields | PASS | 0 missing | |
| A2 AU format | PASS | 0 invalid | |
| A3 searchKeys non-empty | PASS | 0 empty | |
| A4 Prerequisite shape | WARN | 3 malformed | e.g. CSC9999 |
| A5 Empty optional strings | PASS | 0 | |
| B1 day=0 slots | FAIL | 12 | e.g. CY1001 index 10042 |
| B2 Time format | PASS | 0 invalid | |
| B3 Duration math | PASS | 0 wrong | sampled 20 |
| B4 Type enum | PASS | 0 invalid | |
| B5 Duplicate slots | PASS | 0 dupes | |
| B6 Indexes→mdata | PASS | 0 orphans | |
| C1 Exams→mdata | PASS | 0 orphans | |
| C2 Exam day range | PASS | 0 invalid | |
| C3 Exam times | PASS | 0 unparseable | |
| C4 Exam duration | PASS | 0 wrong | |
| D Total modules | INFO | 1234 | |
| D Modules with indexes | INFO | 1198 | 36 without |
| D Modules with exams | INFO | 876 | |
```

For each WARN or FAIL row, list up to 5 concrete examples (course code, index, field, actual value).

## Step 5 — Summary verdict

End with one of:

- **CLEAN** — no FAILs, ≤2 WARNs
- **NEEDS REVIEW** — 1–3 FAILs or >2 WARNs — list what to investigate
- **CORRUPT** — >3 FAILs — recommend re-running the pipeline with `--refetch`
