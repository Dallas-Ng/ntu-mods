# Maintenance

Part of [NTUMods](../README.md). Data publishing is in [scraper/README.md](../scraper/README.md); deployment is in [deployment.md](deployment.md).

Manual tasks at the start of each semester.

## Each semester

1. **Scrape and publish the data.** See [scraper/README.md § Maintenance](../scraper/README.md#maintenance): run the pipeline, publish to D1 and `src/data/api`, add the exam timetable once released.
2. **Update the ICS start date.** Set `MIN_DATE` in [`src/lib/get-ics.ts`](../src/lib/get-ics.ts) to the **Monday of Week 1** (see the NTU academic calendar). It drives recurring events in `.ics` exports.

   ```ts
   const MIN_DATE = new Date("YYYY-MM-DD")
   ```

## When fonts change

The web fonts are committed subsets, rebuilt by hand with `python3 scripts/fonts/subset-fonts.py`. Rerun it when a new character shows up on most pages, when a weight or font feature is added, or when the source fonts are replaced; see [fonts.md § When to rerun](fonts.md#when-to-rerun).
