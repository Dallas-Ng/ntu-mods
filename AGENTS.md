# Agent runbook

## Refresh the latest course data

Scrapes the newest semester from the NTU portal and republishes it. Full pipeline
takes ~5 min with `--workers 4`. Run everything from the repo root unless noted.

### 1. Find the latest semester

```bash
cd scraper && python3 step1_fetch_semesters.py --pretty && head -5 data/01_semesters.json
```

First entry is the newest. Use its `code` (e.g. `2026;1`) everywhere below — **always
quote it**, `;` is a shell separator. Deps are already installed globally; no venv needed.

### 2. Scrape + convert

```bash
python3 main.py --semester "2026;1" --refetch --workers 4
```

Writes `data/0{2,2b,3,4,5}_*_2026_1.json`. Exams (step 5) need
`data/exams/exams-YYYY-YYYY-s{1|2}.csv` to exist first — otherwise that file comes out empty.

### 3. Sanity-check the diff before publishing

The portal can serve an error page or a partial result; a blind publish would wipe
real data. Compare new output against what's live:

```bash
python3 - <<'PY'
import json
pairs = [('mdata','data/03_mdata_2026_1.json','../src/data/api/metadata/2026_1.json'),
         ('indexes','data/04_indexes_2026_1.json','../src/data/api/indexes/2026_1.json'),
         ('exams','data/05_exams_2026_1.json','../src/data/api/exams/2026_1.json')]
for kind, new, old in pairs:
    n, o = json.load(open(new)), json.load(open(old))
    common = set(n) & set(o)
    print(f'{kind}: old {len(o)} new {len(n)} | +{len(set(n)-set(o))} -{len(set(o)-set(n))} ~{sum(n[k]!=o[k] for k in common)}')
    if kind == 'mdata':
        for f in ('description', 'prerequisite'):
            print('  lost', f, [k for k in common if o[k].get(f) and not n[k].get(f)][:10])
PY
```

What is normal vs. not:

- Dozens added/removed each run — normal, courses come and go.
- Large `~changed` count on mdata — usually just `searchKeys` reordering. Not a real diff.
- Fields lost on **surviving** courses — investigate. Missing `description`/`gradeType`
  across many courses means step 2b failed; re-run rather than publish.
- New total far below old total — portal problem. Do not publish.

Full correctness rules: [scraper/README.md § Data Invariants](scraper/README.md#data-invariants).

### 4. Publish — two independent destinations, both needed

```bash
python3 main.py --semester "2026;1" --load   # -> Cloudflare D1 (historic-snapshot route)
python3 stepfinal_upsync.py                  # -> src/data/api (everything else)
```

The load stages into `db/ntu-mods.sqlite` first, so that file must be a replica of the
database being loaded. **The defaults disagree:** `yarn db:pull` pulls `ntu-mods-dev`,
`load-semester.mjs` writes `ntu-mods` (prod). Pull the same DB you intend to load:

```bash
node scripts/db/sync-db.mjs --from d1 --database ntu-mods   # or NTU_MODS_D1=ntu-mods yarn db:pull
```

`--load` replaces that scope's rows atomically and refuses a >20% row drop without
`--force`. `--dry-run` previews either command. Neither one publishes the other's
destination.

Then verify and ship — **the push is what makes the site show new data**:

```bash
yarn db:verify   # from repo root; confirms D1 matches src/data/api exactly
```

Commit and push `src/data/api`. `src/data/api/semesters.json` is generated at build
time from the metadata files, so a new semester appears once its metadata lands.

### Confirm before running

Steps 1–3 and `stepfinal_upsync.py` only touch local files. Step 4's `--load` writes to
production D1 and the push triggers a rebuild — ask first.
