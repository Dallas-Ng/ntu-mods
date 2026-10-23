import { siteConfig } from "@/config/site"
import { formatCount } from "@/lib/format"
import type { SiteFacts } from "@/astro/lib/site-facts"

const articleLines = (facts: SiteFacts) =>
  facts.articlesByCategory
    .map(
      ({ category, articles }) =>
        `## Articles: ${category}\n\n${articles
          .map((a) => `- [${a.title}](${a.url}): ${a.description}`)
          .join("\n")}`
    )
    .join("\n\n")

export function getLlmsContent(facts: SiteFacts): string {
  const { url } = siteConfig
  const modules = formatCount(facts.modules)
  const indexes = formatCount(facts.indexes)

  return `# NTUMods

> NTUMods is a free, independent timetable planner, module browser, and exam schedule for Nanyang Technological University (NTU) students in Singapore. Build and share timetables, browse ${modules} modules across all faculties, check exam schedules, and export to calendar. No login or account required.

NTUMods is not affiliated with or endorsed by Nanyang Technological University. All timetable data is stored in the user's browser (localStorage); nothing is sent to NTUMods servers. Current semester: ${facts.semesterLabel}. Historical data is available from AY2014 Semester 1. Free to use. No account required. The site is built with Astro and hosted on Cloudflare.

NTU terminology used throughout this site: STARS (Student Allocation of Registered Subjects) is NTU's official course registration system. NTUMods helps students plan before STARS opens, but does not perform registration and does not show live index vacancies. An index is a specific class group for a module with fixed timeslots and venues. AU (Academic Unit) is NTU's credit system, roughly one contact hour per week per semester. BDE (Broadening and Deepening Elective) is a flexible elective module taken outside a student's core curriculum. CC (Common Core) modules are interdisciplinary courses required for most NTU undergraduates. NUSMods (nusmods.com) is a comparable tool for NUS (National University of Singapore), a separate university and an unrelated project.

## Core Tools

- [Timetable Planner](${url}/timetable): Visual timetable builder with automatic clash detection and index comparison. Manual planning plus a generator (constraint-based optimisation with free-day, lunch-break and daily-hours preferences, index locking, a "unique layouts only" switch and up to 60 distinct timetables per run). A Walking between classes view shows one day of classes on the campus map with the walking time between venues and a warning when a gap is too short or classes overlap. Plans can be named, the side panel can sit beside or below the table, and a toolbar holds sharing, import, calendar, wallpaper, table settings and appearance. Custom blocks are personal time blocks (gym, CCA, lunch, work) that clash-check against registered modules, can hold multiple alternative time options for the generator to choose between, and can be shared by link or an importable text code. Registered modules can carry personal notes scoped to one index or to every index. A "standardised scale" table setting keeps every 30-minute row the same height. Up to 5 plans, bulk import of comma-separated module codes, calendar export (.ics for Google Calendar, Apple Calendar, Outlook), timetable sharing via URL, and a phone wallpaper export.
- [Module Browser](${url}/mods): Search ${modules} NTU modules (${facts.semesterLabel}) by code or title, and filter by module type, school, level, semester, day and time range. View AU value, prerequisites, mutually exclusive modules, exam date and time, all ${indexes} class indexes with timeslots and venues, and an interactive prerequisite graph on each module page. Favourite modules (saved to localStorage) and add modules directly to any of 5 timetable plans. Every current module is also listed as a plain link under "Browse modules by code" on the page.
- [Exam Schedule](${url}/exams): All ${facts.exams} NTU exams for the current semester with date, start and end time, and duration. Searchable by module code or name, and groupable by date or school. The data does not include exam venues or seat numbers; NTU publishes those separately about two weeks before exams.
- [Tools](${url}/tools): Index of free NTU student tools that run in the browser. Currently the CGPA Planner, the FGO Optimiser and the Wallpaper Maker.
- [CGPA Planner](${url}/tools/cgpa-planner): Enter a current CGPA, letter-graded AU completed and AU still to take (or upload an NTU transcript PDF, parsed in the browser and never uploaded) to see the average grade needed over the remaining AU for each honours class: Highest Distinction (4.50), Distinction (4.00), Merit (3.50) and Honours (3.00). Shows whether each class is already secured, within reach or out of reach. Unofficial; some programmes set their own bands. Background: [NTU honours and CGPA guide](${url}/articles/ntu-honours-classification-cgpa-guide).
- [FGO Optimiser](${url}/tools/fgo-optimiser): Upload an official NTU transcript PDF (parsed in the browser, never uploaded) to find the modules to put under the Flexible Grading Option (FGO) for the highest CGPA. Applies the 21 or 24 AU programme quota and the 12 AU combined cap on Major Core, ICC and MPE, counts FGO already used (including No Record AU entered manually), locks Final Year Projects and attachments, and shows the projected CGPA live. Unofficial; confirm against the NTU FGO portal. Background: [NTU FGO guide](${url}/articles/ntu-fgo-su-option-guide).
- [Student Links](${url}/links): Curated list of NTU student portals, split between NTUMods tools (unofficial) and official NTU portals: STARS, NTULearn, Degree Audit, Transcript, Class Schedule, FGO Portal, Academic Calendar, Library Booking, Facilities Booking, CareerAxis, InPlace, GEM Portal, Course Matching, and Financial Aid.
- [AI Instructions](${url}/ai-instructions): Canonical long-form reference for AI systems: product description, feature details, FAQ, NTU terminology, LLM guidance, and structured data.

${articleLines(facts)}

## For AI Agents

- [AI Catalog](${url}/.well-known/ai-catalog.json): Machine-readable list of what agents can use on this site, following the AI Catalog format.
- [Campus Map](${url}/maps): Interactive NTU campus map. Search any lecture theatre, tutorial room, hall or canteen, see which level it is on with indoor floor plans, and get walking directions with times. Standard, hybrid and satellite views, and links that share an exact view.
- [WebMCP tools](${url}/.well-known/webmcp.json): Early preview, depends on browser support. The tools NTUMods registers through WebMCP (document.modelContext) in supporting browsers: search modules, read indexes and exams, add modules to a plan, find indexes that fit around it, generate clash-free timetables, export to calendar and plan CGPA. They run in the visitor's own tab on that visitor's own saved plans.
- [MCP server](${url}/developers/mcp): A public, read-only MCP server at ${url}/mcp (POST, no sign-in). Tools: list_semesters, search_modules, get_module, get_module_indexes, get_exam and list_exams. Add it to Claude, ChatGPT, Claude Code or Cursor; steps are on the developers page.
- [Module API](${url}/api/modules/SC1003): GET /api/modules/{code} returns one module as JSON (example shown). Open data files: [modules](${url}/data/api/modules.json), plus class indexes and exams per semester under /data/api/indexes/ and /data/api/exams/. Docs: [WebMCP](${url}/developers/webmcp).

## Guides & Reference

- [FAQ](${url}/faq): Answers to common questions about NTUMods features, NTU terminology, data storage, timetable planning, and the open-source project (licence, contributing, reporting bugs and security issues).
- [Privacy Policy](${url}/privacy): Which analytics tools are used (Google Analytics 4, PostHog), what is collected, and confirmation that timetable data never leaves the user's device. Also covers what the public API and MCP server log (for MCP: tool name, status, latency and client name, never the arguments). Analytics need opt-in consent in the EEA, UK, Switzerland, Brazil, South Korea and Quebec.
- [Terms of Use](${url}/terms): Terms for using NTUMods, including fair use of the public API, open data files and MCP server.
- [Source code](https://github.com/Dallas-Ng/ntu-mods): Open source (MIT) on GitHub. Issues and pull requests are welcome, see CONTRIBUTING.md in the repository.
- [Security contact](${url}/.well-known/security.txt): How to report a vulnerability privately (RFC 9116). Do not report security problems in public issues.

## Optional

- [Wallpaper Maker](${url}/screenshot): Also listed under Tools. Export a timetable as a phone lockscreen wallpaper image with presets for common screen sizes.
- [Feedback](${url}/feedback): Bug reports and feature suggestions. Email address optional.
- [Changelog](${url}/changelog): Update history.
- [Sitemap](${url}/sitemap): Full page index.
`
}
