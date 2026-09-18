# Agent runbook

## Refresh the latest course data

Scrapes the newest semester from the NTU portals and republishes it. One
command does scrape → convert → check; publishing is two flags. About 2 min
with 4 workers. Run from `scraper/`. Deps are installed globally; no venv.

### 1. Scrape and check (local files only, safe to run any time)

```bash
cd scraper && python3 main.py --refetch
```

Defaults to the newest semester the portal lists (`-s "2026;1"` to pin one).
Writes `data/0{2,2b,3,4,5}_*.json` and `data/exams/*.csv`, then prints a
`[Check]` report comparing the result against what is live in `src/data/api`.

Read the report. `OK — safe to publish` means the gate passed. Otherwise it
lists `PROBLEM:` lines and exits 1 — do not publish. Typical causes:

- total far below live → portal served an error/partial page. Re-run.
- surviving courses lost `description`/`gradeType` → content portal failed. Re-run.
- exam timetable not released yet → it says so and keeps/empties the exams file. Fine to publish courses.

Notes (`+N -N ~N`, orphaned exams, `day=0` slots) are informational. Dozens of
courses added/removed per run is normal churn.

To re-run only the gate: `python3 check.py "2026;1"`. To refresh only exams:
`python3 main.py --scope exams --refetch`.

### 2. Publish — two destinations, both needed. Ask first.

`--load` writes to production D1 and the push below triggers a site rebuild.
Confirm with the user before this step.

```bash
NTU_MODS_D1=ntu-mods yarn --cwd .. db:pull        # local sqlite must mirror the DB being loaded
python3 main.py --load --upsync                   # reuses the scrape from step 1; check runs again
yarn --cwd .. db:verify                           # D1 matches src/data/api exactly
```

`--load` refuses a >20% row drop without `--force`. `--dry-run` previews either flag.

### 3. Ship

Commit and push `src/data/api` (and `scraper/data/exams/*.csv` if it changed).
The push is what makes the site show the new data; `--load` alone does not.

```bash
git add src/data/api scraper/data/exams
git commit -m "chore(data): refresh AY2026 S1 course data"
```

Details: [scraper/README.md](scraper/README.md).
