# Maintenance

Part of [NTUMods](../README.md). Data publishing is in [scraper/README.md](../scraper/README.md); deployment is in [deployment.md](deployment.md).

Manual tasks at the start of each semester.

## Each semester

1. **Scrape and publish the data.** See [scraper/README.md § Maintenance](../scraper/README.md#maintenance): run the pipeline, publish to D1 and `src/data/api`, add the exam timetable once released.
2. **Update the ICS start date.** Set `MIN_DATE` in [`src/lib/get-ics.ts`](../src/lib/get-ics.ts) to the **Monday of Week 1** (see the NTU academic calendar). It drives recurring events in `.ics` exports.

   ```ts
   const MIN_DATE = new Date("YYYY-MM-DD")
   ```
