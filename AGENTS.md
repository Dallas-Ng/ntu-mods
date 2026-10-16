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

## Publishing a new semester (it goes live for everyone)

The site treats the newest semester with data as the default, and the planner
and `/mods` let students switch between the **two newest regular semesters**
(the older one drops out when a third is published). So publishing a new
semester's courses is the go-live moment; do not upsync it before you want it
to be the default.

Before step 2 (`--load --upsync`) for a semester that has never been published:

1. Add its Teaching Week 1 Monday to `src/config/semester-calendar.ts`. The
   prebuild fails without it, and ICS export refuses to guess.
2. Pin the semester with `-s "YYYY;S"` in step 1; the portal's first listed
   semester is not reliably the newest.

After step 3 (push), once the Workers build is live:

3. Purge the Cloudflare cache and run `node scripts/warm-cache.mjs`. Module
   snapshots are cached for 7 days (+30 days stale-while-revalidate), so some
   visitors keep seeing the old default until you do.
4. Run `yarn check:articles` and refresh what it lists: counts, module tables
   and "AY… Semester …" wording in `content/articles`, plus the banner in
   `src/components/banner.tsx` and the dated strings on `/exams` and
   `/timetable`. Keep article slugs; renaming loses their search ranking.

Re-running a refresh for a semester that is already live (NTU keeps changing
slots and exam dates until about week 5-6) needs only steps 1-3 of the main
runbook, then the cache purge above.

Students with plans saved before plans were per-semester are asked once to keep
or clear them; nothing here needs doing for that.
