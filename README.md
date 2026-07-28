# NTU Mods

Build your timetable easier with NTU Mods. Create, customize, and manage your class schedule hassle-free

![NTU Mods Banner](/public/og-image.png)

## Overview

NTU Mods is a timetable planner for Nanyang Technological University (NTU) students. It provides a visual interface to browse modules, view class schedules by index, and build a timetable — without needing to log into STARS.

**Live site:** [ntumods.com](https://ntumods.com)

### Features

- Browse all NTU modules and their class indexes
- Visual timetable builder with drag-and-drop-style index selection
- Conflict detection across selected indexes
- Export timetable as an `.ics` calendar file
- Share timetable via URL
- Module pages with prerequisites, exam dates, and past index history
- Dark mode support
- Historical data going back to AY2014

## Tech Stack

- **Framework:** [Astro](https://astro.build/) with React islands
- **Language:** TypeScript
- **Styling:** Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
- **State:** Zustand
- **Data:** Static JSON files (scraped from NTU STARS)
- **Email:** Resend (for the feedback form)
- **Deployment:** Cloudflare Workers (static assets + on-demand routes)

## Project Structure

```
├── src/
│   ├── astro/              # Astro-only directories (see note below)
│   │   ├── pages/          # Routes — .astro pages and API endpoints
│   │   │   ├── mods/       # Module browser and individual module pages
│   │   │   ├── timetable/  # Timetable builder
│   │   │   ├── share/      # Shared timetable view
│   │   │   ├── screenshot/ # Screenshot-optimised timetable view
│   │   │   ├── api/        # Server endpoints (feedback)
│   │   │   └── ingest/     # PostHog reverse proxy
│   │   ├── layouts/        # Base and minimal page shells
│   │   ├── middleware.ts   # Module-code case normalisation
│   │   └── content.config.ts
│   ├── components/         # React components (islands) and shared UI
│   ├── data/api/           # Static JSON data (modules, indexes, exams)
│   ├── hooks/              # React hooks
│   ├── lib/                # Utility functions and server helpers
│   │   └── server/edge/    # Runtime data readers (ASSETS binding, no fs)
│   └── types/              # Global TypeScript types
├── content/articles/       # Markdown articles (Astro content collection)
├── scripts/                # Build steps + data pipeline
└── scraper/                # Python scrapers for NTU STARS data
```

Astro's special directories live under `src/astro/` rather than the top-level
defaults, via `srcDir` in [`astro.config.mjs`](astro.config.mjs). Everything
shared (`components/`, `hooks/`, `lib/`, `state/`) stays in `src/` and is
imported through the `@/*` alias.

### Rendering model

Cloudflare Workers has no filesystem, so every route is prerendered at build
time (in plain Node, via the adapter's `prerenderEnvironment`) except:

| Route                          | Why on-demand                                                        |
| ------------------------------ | -------------------------------------------------------------------- |
| `/mods/:code/:year/:semester`  | ~28k combinations; prerendering them dominated build time             |
| `/api/feedback`                | Sends mail through Resend at request time                             |
| `/ingest/*`                    | PostHog reverse proxy                                                 |

On-demand routes must not import the `node:fs`-based readers in
`src/lib/server/*.ts` — use `src/lib/server/edge/*` instead, which reads the
same JSON over the `ASSETS` binding.

## Getting Started

### Prerequisites

- Node.js 22+
- Yarn

### Installation

```bash
git clone https://github.com/Dallas-Ng/ntu-mods.git
cd ntu-mods
yarn install
```

### Running Locally

```bash
yarn dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### Checks

```bash
yarn lint
```

Runs ESLint (including `.astro` files), `astro check`, and `tsc`.

### Building for Production

```bash
yarn build
```

This runs the static-data build, `astro build`, the sitemap generator, and the
IndexNow submission (skipped unless `WORKERS_CI`, `CF_PAGES`, or `INDEXNOW=1`
is set). Preview the built output with `yarn preview`.

## Deployment

Deployed to Cloudflare Workers. The root [`wrangler.jsonc`](wrangler.jsonc) is
deliberately assets-only — `@astrojs/cloudflare` emits the real, self-contained
worker config after a successful build, so deploy with that one:

```bash
npx wrangler deploy --config dist/server/wrangler.json
```

### Secrets

Set as Worker secrets (not `.env`), read via `locals.runtime.env`:

| Name                    | Used by                                   |
| ----------------------- | ----------------------------------------- |
| `RESEND_KEY`            | `/api/feedback` — sends the feedback email |
| `PUBLIC_POSTHOG_TOKEN`  | PostHog, client and server-side capture    |

## Data Pipeline

Module and index data is sourced from NTU STARS and stored in a Cloudflare D1
database, which is the single source of truth. The scraper writes to it, and
both the build and the running Worker read from it.

The scraper lives in `scraper/` and runs in order:

```
scraper/
  step1_fetch_semesters.py   # Discover available semesters
  step2_scrape_courses.py    # Scrape course listings per semester
  step2b_scrape_content.py   # Scrape the content portal (descriptions, restrictions)
  step3_convert_mdata.py     # Normalise module metadata
  step4_convert_indexes.py   # Normalise class indexes
  step5_convert_exams.py     # Convert the exam CSV
  stepfinal_upsync.py        # Copy the output into src/data/api
```

### Working with the database

```bash
yarn db:build     # Rebuild the local SQLite file from src/data/api
yarn db:pull      # Download the database from D1 instead (needs wrangler auth)
yarn db:verify    # Assert the database reproduces every JSON file exactly
yarn db:dump      # Emit SQL for `wrangler d1 execute --file`
yarn data         # Regenerate the static artifacts the client fetches
```

`yarn dev` and `yarn build` both run `yarn data` first, which creates the local
database if it is missing and regenerates `public/data/api/`. Neither directory
is committed — `public/data/api/` is build output, and `db/*.sqlite` is a
derived read replica of D1.

Loading a semester into D1 is **not** enough to change the live site: the
prerendered pages and the client artifacts are published by a rebuild. Only the
on-demand `/mods/:code/:year/:semester` route reflects D1 immediately.

### The current semester

The current semester is derived, not configured: it is the newest semester in
the database that actually has offerings, ordered by `semesters.sort_key`. There
is nothing to edit when a new semester arrives — load it and rebuild.

Semester codes follow the format `{year};{semester}` where semester is `1`, `2`,
`S` (Special Term), or `T` (Special Term II). `sort_key` is
`int(year) * 10 + {1:1, 2:2, S:3, T:4}`, computed from the code — never from the
portal's list order, which is not self-consistent (AY2025 lists `2,1,S` while
AY2024 lists `1,2,S`).

## Maintenance

The following tasks must be performed manually at the start of each semester.

### Each Semester

#### 1. Run the data pipeline

Re-run the full scraper pipeline (see [Data Pipeline](#data-pipeline)) with the new semester code.

#### 2. Add exam timetable

Download the exam timetable from NTU and place the CSV in `scraper/data/exams/` with the naming convention:

```
exams-YYYY-YYYY-sX.csv   # e.g. exams-2025-2026-s2.csv
```

Then re-run `scraper/step5_convert_exams.py` to convert it.

#### 3. Update ICS start date

Update `MIN_DATE` in [`src/lib/get-ics.ts`](src/lib/get-ics.ts) to the **Monday of Week 1** of the new semester:

```ts
const MIN_DATE = new Date("YYYY-MM-DD")
```

This date is used to calculate recurring calendar events in `.ics` exports. The correct date can be found in the NTU academic calendar.

### Each Academic Year

#### 4. Update banner and landing page

- [`src/components/banner.tsx`](src/components/banner.tsx) — update the banner announcement text with the new academic year
- [`src/components/landing/landing-product.tsx`](src/components/landing/landing-product.tsx) — update `LANDING_YEAR` and `LANDING_SEMESTER` constants

## Contributing

Contributions are welcome. Please open an issue first to discuss any significant changes.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Open a pull request

## License

Licensed under the [MIT license](https://github.com/Dallas-Ng/ntu-mods/blob/main/LICENSE.txt).
