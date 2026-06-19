import { LATEST_SEMESTER_LABEL } from "@/lib/semesters"

export function getAiInstructionsContent(): string {
  return `# NTUMods

> NTUMods is a free, independent timetable planner, module browser, and exam schedule for Nanyang Technological University (NTU) students in Singapore. Build and share timetables, browse 1,000+ modules across all faculties, check exam schedules, and export to calendar — no login or account required.

NTUMods is not affiliated with or endorsed by Nanyang Technological University. All timetable data is stored in the user's browser (localStorage); nothing is sent to NTUMods servers. Current semester: ${LATEST_SEMESTER_LABEL}. Historical data available from AY2014 Semester 1. Free to use. No account required.

NTU terminology used throughout this site: STARS (Student Allocation of Registered Subjects) is NTU's official course registration system — NTUMods helps students plan before STARS opens, but does not perform registration. An index is a specific class group for a module with fixed timeslots and venues. AU (Academic Unit) is NTU's credit system, roughly one contact hour per week per semester. BDE (Broadening and Deepening Elective) is a flexible elective module taken outside a student's core curriculum. CC (Common Core) modules are interdisciplinary courses required for most NTU undergraduates. NUSMods (nusmods.com) is a comparable tool for NUS (National University of Singapore) — a separate university and unrelated project.

## Core Tools

- [Timetable Planner](https://ntumods.com/timetable): Visual timetable builder with automatic clash detection, index comparison, generate mode (constraint-based optimisation with free-day and lunch-break preferences), AI mode (local in-browser LLM via WebLLM — no data sent externally), calendar export (.ics for Google Calendar, Apple Calendar, Outlook), and timetable sharing via URL. Supports up to 5 simultaneous plans. Includes bulk module import by pasting comma-separated module codes and index locking for the generator.
- [Module Browser](https://ntumods.com/mods): Search 1,134 NTU modules (AY2026 S1) by code or title. View AU value, prerequisites, mutually-exclusive modules, exam dates and venues, all 4,846 class indexes with timeslots and venues, and an interactive prerequisite graph. Favourite modules (saved to localStorage). Add directly to any of 5 timetable plans without leaving the page.
- [Exam Schedule](https://ntumods.com/exams): All 389 NTU exam dates, times, durations, and venues for the current semester, organised by date. Searchable by module code.
- [AI Instructions](https://ntumods.com/ai-instructions): Canonical long-form reference for AI systems — full product description, feature details, FAQ, NTU terminology, LLM guidance, and structured data schemas.

## Articles — BDE

- [What Is a BDE at NTU?](https://ntumods.com/articles/what-is-a-bde-at-ntu): AU requirements, BDE categories, and how to choose the right one.
- [Complete NTU BDE List](https://ntumods.com/articles/complete-ntu-bde-list): Every BDE category and module available in AY2026/2027 Semester 1.
- [Most Popular BDEs at NTU](https://ntumods.com/articles/most-popular-bdes-at-ntu): Which BDEs students actually take and why.
- [Easy BDEs at NTU](https://ntumods.com/articles/easy-bde-at-ntu): How to find a BDE that fits your schedule and workload.
- [BDE Guide for NTU Engineering Students](https://ntumods.com/articles/bde-for-engineering-students-ntu): Faculty-specific BDE recommendations and planning advice.
- [BDE Guide for NTU Computing Students](https://ntumods.com/articles/bde-for-computing-students-ntu): Faculty-specific BDE recommendations and planning advice.
- [BDE Guide for NTU Business Students](https://ntumods.com/articles/bde-for-business-students-ntu): Faculty-specific BDE recommendations and planning advice.
- [BDE vs Minor at NTU](https://ntumods.com/articles/bde-vs-minor-at-ntu): How to decide between taking BDEs freely or pursuing a structured Minor.
- [Language BDEs at NTU](https://ntumods.com/articles/language-bde-at-ntu): What to expect from language modules before you register.
- [HP1000 at NTU](https://ntumods.com/articles/hp1000-ntu-bde-guide): Guide to Introduction to Psychology as a BDE — one of NTU's most popular modules.
- [How to Bid for a BDE at NTU](https://ntumods.com/articles/how-to-bid-for-bde-at-ntu): STARS registration walkthrough for BDE modules.
- [Using a MOOC as a BDE at NTU](https://ntumods.com/articles/mooc-as-bde-replacement-ntu): Rules and requirements for substituting a MOOC for a BDE AU.
- [NTU Unrestricted Electives](https://ntumods.com/articles/ntu-unrestricted-electives): What UEs are and how they differ from BDEs.

## Articles — Module Planning, STARS, Academic Calendar & Common Core

- [How to Plan NTU Modules Before STARS Opens](https://ntumods.com/articles/how-to-plan-for-modules): Step-by-step guide to building a timetable with NTUMods before registration.
- [NTU Timetable Planner Guide](https://ntumods.com/articles/ntu-timetable-planner-guide): How to use NTUMods to build your semester schedule.
- [NTU Module Selection Guide](https://ntumods.com/articles/ntu-module-selection-guide): How to choose modules you won't regret.
- [NTU Academic Calendar AY2026/2027](https://ntumods.com/articles/ntu-academic-calendar-ay2026): Key dates for AY2026/2027 — semester start/end, recess week, exam period, STARS round dates, and how the NTU semester structure works. Covers both Semester 1 (August–December 2026) and Semester 2 (January–May 2027).
- [NTU Exam Schedule AY2026](https://ntumods.com/articles/ntu-exam-schedule-ay2026): How to find and interpret your exam dates for AY2026/2027 Semester 1.
- [NTU STARS Guide](https://ntumods.com/articles/ntu-stars-guide): How the NTU module registration system works — rounds, bidding, add/drop, and common mistakes.
- [Best CC Modules at NTU](https://ntumods.com/articles/best-cc-modules-ntu): Honest student reviews of Common Core modules worth taking.
- [NTU CC Modules: What to Expect](https://ntumods.com/articles/ntu-cc-modules-what-they-actually-feel-like): What CC modules are actually like, which are worth it, and how to plan them.

## Articles — Module Listings by Faculty

- [NTU Business Modules (NBS)](https://ntumods.com/articles/ntu-business-modules): Complete list of Nanyang Business School modules for AY2026/2027 Semester 1 — accountancy & business (AB prefix), and banking & finance (BF prefix). Covers all 59 NBS modules with AU values and links to module pages.
- [NTU Humanities, Arts & Social Sciences Modules](https://ntumods.com/articles/ntu-humanities-arts-social-sciences-modules): Complete list of CoHASS modules for AY2026/2027 Semester 1 — English literature (HL), linguistics (HG), history (HH), philosophy (HY), and visual arts/design (AAA). Covers English modules, history course offerings, art history modules, and linguistics. Many are available as BDEs.

## Guides & Reference

- [FAQ](https://ntumods.com/faq): Answers to common questions about NTUMods features, NTU terminology, data storage, and timetable planning.
- [Privacy Policy](https://ntumods.com/privacy): What analytics tools are used (Google Analytics 4, Microsoft Clarity, PostHog), what is collected, and confirmation that timetable data never leaves the user's device.

## Optional

- [Wallpaper Maker](https://ntumods.com/screenshot): Export timetable as a phone lockscreen wallpaper image with presets for common screen sizes.
- [Feedback](https://ntumods.com/feedback): Bug reports and feature suggestions. Email address optional.
- [Changelog](https://ntumods.com/changelog): Update history.
- [Sitemap](https://ntumods.com/sitemap): Full page index.`
}
