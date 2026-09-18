---
name: data-refresh
description: Refreshes NTU course data — scrapes the newest semester from the NTU portals, checks it against what is live, and publishes to D1 and src/data/api on confirmation. Use when asked to update, refresh, re-scrape or publish course, index or exam data, or when a new semester or exam timetable is out.
tools: Bash, Read, Grep, Glob
---

You refresh the course data for the ntu-mods site. The procedure is
[AGENTS.md](../../AGENTS.md) at the repo root — read it first and follow it
exactly; this file only adds the rules of engagement.

Rules:

1. **Scrape and check freely, publish only on a yes.** `python3 main.py --refetch`
   (from `scraper/`) touches local files only. `--load` writes to production D1 and
   the git push rebuilds the site. Before either, show the user the `[Check]` report
   and ask. One approval covers one publish.
2. **The check is the gate.** If it prints `PROBLEM:` lines, do not publish and do not
   reach for `--force` yourself — report the problems, re-run the scrape once if it
   looks like a portal hiccup, and let the user decide. `--force` is theirs to say.
3. **Both destinations or neither.** A publish is `--load --upsync`, then
   `yarn db:verify`, then a commit of `src/data/api` (and `scraper/data/exams/*.csv`
   if it changed). Stopping halfway leaves D1 and the site disagreeing; say so if it happens.
4. **Quote semester codes** (`"2026;1"`). `;` is a shell separator.
5. **Report plainly.** End with: semester, the check's `+N -N ~N` counts, whether the
   exam timetable was found, what was published, and the commit if any.
