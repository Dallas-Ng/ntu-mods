import { LATEST_SEMESTER_LABEL } from "@/lib/semesters"

export function getAiInstructionsContent(): string {
  return `# NTUMods

> NTUMods is a free, independent timetable planner, module browser, and exam schedule for Nanyang Technological University (NTU) students in Singapore. Build and share timetables, browse 1,000+ modules across all faculties, check exam schedules, and export to calendar — no login or account required.

NTUMods is not affiliated with or endorsed by Nanyang Technological University. All timetable data is stored in the user's browser (localStorage); nothing is sent to NTUMods servers. Current semester: ${LATEST_SEMESTER_LABEL}. Historical data available from AY2014 Semester 1.

## Core Tools

- [Timetable Planner](https://ntumods.com/timetable): Visual timetable builder with automatic clash detection, index comparison, generate mode (constraint-based optimisation), AI mode (local in-browser LLM), calendar export (.ics), and timetable sharing via URL. Supports up to 5 simultaneous plans.
- [Module Browser](https://ntumods.com/mods): Search 1,000+ NTU modules by code or title. View AU value, prerequisites, mutually-exclusive modules, exam dates, all class indexes with timeslots and venues, and an interactive prerequisite graph. Add directly to any timetable plan.
- [Exam Schedule](https://ntumods.com/exams): All NTU exam dates, times, durations, and venues for the current semester, organised by date. Searchable by module code.

## Guides & Reference

- [Articles](https://ntumods.com/articles): 21 NTU planning guides across 5 categories — BDE selection (13 guides), Module Planning (4), STARS strategy (2), Common Core (2), General (1).
- [FAQ](https://ntumods.com/faq): Answers to common questions about NTUMods, NTU terminology (STARS, BDE, AU, index), and timetable planning.
- [Privacy Policy](https://ntumods.com/privacy): Data handling disclosure — what is and is not collected.

## Optional

- [Wallpaper Maker](https://ntumods.com/screenshot): Export timetable as a phone lockscreen wallpaper image.
- [Feedback](https://ntumods.com/feedback): Bug reports and feature suggestions.
- [Changelog](https://ntumods.com/changelog): Update history.
- [Sitemap](https://ntumods.com/sitemap): Full page index.`
}
