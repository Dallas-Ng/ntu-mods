# Maintenance

Part of [NTUMods](../README.md). Data publishing is in [scraper/README.md](../scraper/README.md); deployment is in [deployment.md](deployment.md).

Manual tasks at the start of each semester.

## Each semester

1. **Scrape and publish the data.** See [scraper/README.md § Maintenance](../scraper/README.md#maintenance): run the pipeline, publish to D1 and `src/data/api`, add the exam timetable once released.
2. **Refresh the academic calendar** once a year, when NTU confirms the next academic year's calendar (usually in February). `python3 scraper/academic_calendar.py --upsync`, then commit `src/data/api/calendar.json`. It reads the semester calendar PDF and feeds the `/calendar` page, the `/calendar.ics` feed and the timetable's `.ics` export. Subscribers get the new year the next time their calendar app refreshes the feed. See [scraper/README.md § Academic calendar](../scraper/README.md#academic-calendar).

## When fonts change

The web fonts are committed subsets, rebuilt by hand with `python3 scripts/fonts/subset-fonts.py`. Rerun it when a new character shows up on most pages, when a weight or font feature is added, or when the source fonts are replaced; see [fonts.md § When to rerun](fonts.md#when-to-rerun).
