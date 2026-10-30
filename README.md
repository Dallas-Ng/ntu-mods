<h1 align="center">NTUMods</h1>

<p align="center">
  A free, open source timetable planner for Nanyang Technological University students.<br />
  Browse modules, compare class indexes, and build a clash-free timetable without logging into STARS.
</p>

<p align="center">
  <a href="https://ntumods.com">Live site</a> ·
  <a href="https://github.com/Dallas-Ng/ntu-mods/issues/new/choose">Report a bug</a> ·
  <a href="https://github.com/Dallas-Ng/ntu-mods/issues/new/choose">Request a feature</a>
</p>

![NTUMods banner](/public/og-image.png)

**Quick links**

- [Features](#features)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Architecture](docs/architecture.md)
- [Design rules](docs/design.md)
- [Fonts](docs/fonts.md)
- [Contributing](#contributing)
- [Deployment](docs/deployment.md)
- [Maintenance](docs/maintenance.md)
- [Changelog](https://ntumods.com/changelog)
- [Developers](https://ntumods.com/developers)

## Features

**Timetable planning**

- Visual timetable builder with named plans, clash detection and an index picker that highlights alternatives
- Generate mode that produces up to 60 distinct timetables, with constraints for day hours, lunch breaks and spacing, module locks and blocked slots
- Custom courses and blocks (gym, CCA, work) with multiple options, treated as real obstacles during generation
- Walking time between back-to-back classes, shown on the campus map with a warning when the gap is too short
- Share a timetable by URL, export to `.ics` with a preview, or save a screenshot
- Appearance settings for radius, density, contrast, colour palette and table scale, with dark mode

**Modules and exams**

- Every NTU module and class index, with historical data back to AY2014
- Filter modules by the days and time window you are free
- Module pages with prerequisites, exam dates, workload information and past index history
- Exam timetable browser with search and grouping
- Favourite modules, and a student links page for STARS, NTULearn, Degree Audit and other portals

**Campus map**

- Search any lecture theatre, tutorial room, hall or canteen on MazeMap, with indoor floor plans from Basement 7 to Level 9
- Walking directions with times, standard, hybrid and satellite views, and shareable links to an exact view
- Browse halls, food, bus stops, car parks and toilets

**Tools** (run in your browser; transcripts are not uploaded)

- CGPA planner: the average grade needed for each honours class, from a manual entry or an uploaded transcript
- FGO optimiser: which modules to Flexible-Grade for the highest CGPA, accounting for earlier FGO and S/U use
- Timetable wallpaper maker

**For developers and AI assistants**

- Free public module API and open JSON data for modules, indexes and exams, documented in the [developer docs](https://ntumods.com/developers) with an OpenAPI file
- A public, read-only [MCP server](https://ntumods.com/developers/mcp) for Claude, ChatGPT, Claude Code and Cursor; see [docs/mcp.md](docs/mcp.md)
- [WebMCP](https://github.com/webmachinelearning/webmcp) support (developer preview), so a supporting browser can let an assistant search modules and generate timetables from your saved plans
- `llms.txt` for AI crawlers

**Guides and community**

- Articles on module selection, BDE and CC choices, STARS, exams and the academic calendar
- In-app feedback form and a public changelog

## Built with

[Astro](https://astro.build/) and React, TypeScript, Tailwind CSS with [shadcn/ui](https://ui.shadcn.com/), and Zustand. Course data is scraped from NTU portals by a Python pipeline and served from static JSON plus Cloudflare D1. The site runs on Cloudflare Workers.

See [docs/architecture.md](docs/architecture.md) for how the pieces fit together.

## Getting started

You need Node.js 22+ and [pnpm](https://pnpm.io/).

```bash
git clone https://github.com/Dallas-Ng/ntu-mods.git
cd ntu-mods
pnpm install
pnpm db:seed-local   # seeds the local database; takes about a minute
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321). Re-run `pnpm db:seed-local` whenever `src/data/api` changes.

Useful commands:

| Command         | What it does                     |
| --------------- | -------------------------------- |
| `pnpm dev`      | Start the dev server             |
| `pnpm lint`     | ESLint, `astro check`, and `tsc` |
| `pnpm test`     | Unit tests (Vitest)              |
| `pnpm test:e2e` | End-to-end tests (Playwright)    |
| `pnpm build`    | Production build                 |

## Project structure

| Path                | Contents                                         | Docs                                   |
| ------------------- | ------------------------------------------------ | -------------------------------------- |
| `src/`              | Pages, components, hooks, and server helpers     | [src/README.md](src/README.md)         |
| `scraper/`          | Python scrapers that produce the course data     | [scraper/README.md](scraper/README.md) |
| `db/`               | D1 schema and database tooling                   | [db/README.md](db/README.md)           |
| `content/articles/` | Markdown articles                                |                                        |
| `docs/`             | Architecture, deployment, and maintenance guides | [docs/](docs/)                         |

## Contributing

Contributions of every size are welcome, whether that is a typo fix, a bug report, or a new feature. You do not need to be an NTU student to help.

**Ways to help**

- Report a bug or suggest an idea through an [issue](https://github.com/Dallas-Ng/ntu-mods/issues/new/choose)
- Fix a bug or improve the documentation
- Improve accessibility, performance, or the mobile experience
- Write or improve an article in `content/articles/`

**How to contribute**

1. For anything beyond a small fix, open an issue first so we can agree on the approach.
2. Fork the repository and create a branch, for example `feat/my-feature`.
3. Make your change, then run `pnpm lint` and `pnpm test`.
4. Open a pull request and fill in the template.

Setup steps and the full checklist are in [CONTRIBUTING.md](CONTRIBUTING.md). Report security issues privately, see [SECURITY.md](SECURITY.md). Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). If you get stuck, open an issue or ask in your pull request; questions are welcome.

Maintainers: see [docs/maintenance.md](docs/maintenance.md) for the per-semester checklist and [docs/deployment.md](docs/deployment.md) for releases.

## Support

NTUMods is free and maintained by one person. If it saved you time, you can [buy me a coffee](https://buymeacoffee.com/dallasng) or sponsor on [GitHub](https://github.com/sponsors/Dallas-Ng).

## License

Released under the [MIT License](LICENSE.txt).
