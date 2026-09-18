# NTU Mods

Build your timetable easier with NTU Mods. Create, customize, and manage your class schedule hassle-free

![NTU Mods Banner](/public/og-image.png)

## Table of Contents

- [Overview](#overview)
  - [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
  - [Rendering model](#rendering-model)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
  - [Checks](#checks)
  - [Building for Production](#building-for-production)
- [Deployment](#deployment)
  - [Secrets](#secrets)
- [Data Pipeline](#data-pipeline)
  - [Working with the database](#working-with-the-database)
  - [The current semester](#the-current-semester)
- [Maintenance](#maintenance)
  - [Each Semester](#each-semester)
  - [Each Academic Year](#each-academic-year)
- [Contributing](#contributing)
- [License](#license)

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
- **Data:** Scraped from NTU STARS into JSON (build-time, most of the site) and Cloudflare D1 (one live route — see [Data Pipeline](#data-pipeline))
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
│   │   └── server/
│   │       ├── db/         # json-source.ts (build-time reads) + D1 query layer
│   │       └── edge/       # On-demand routes — D1 binding, no fs
│   └── types/              # Global TypeScript types
├── content/articles/       # Markdown articles (Astro content collection)
├── db/migrations/          # D1 schema
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

On-demand routes must not import `src/lib/server/db/repo.ts` (or
`json-source.ts` underneath it) — both use `node:fs` to read `src/data/api`,
unavailable in the Workers runtime. Use `src/lib/server/edge/*` instead,
which queries the D1 binding.

## Getting Started

### Prerequisites

- Node.js 22+
- Yarn
- A Cloudflare account with access to the `ntu-mods` D1 database (see
  [Running Locally](#running-locally) — `wrangler.jsonc`'s D1 binding is
  `remote: true`, so dev needs auth against the real database)

### Installation

```bash
git clone https://github.com/Dallas-Ng/ntu-mods.git
cd ntu-mods
yarn install
```

### Running Locally

The `/mods/:code/:year/:semester` route reads D1 live (see
[Rendering model](#rendering-model)), and `wrangler.jsonc` sets `remote: true`
on that binding, so `astro dev` proxies queries to the real Cloudflare D1
database over the network instead of an empty local one. Authenticate once
before your first `yarn dev`:

```bash
npx wrangler login
```

In a non-interactive shell (CI, some sandboxed/agent terminals) `wrangler
login`'s OAuth flow can't run — set a `CLOUDFLARE_API_TOKEN` env var instead
([create one here](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)).
Without either, dev fails with `Failed to start the remote proxy session`.

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

Module and index data is sourced from NTU STARS. The scraper writes it to two
independent places: Cloudflare D1, which the on-demand historic-snapshot
route reads live, and `src/data/api`, which the build reads to prerender
pages and generate the client's bulk JSON. Publishing a semester means doing
both — see [Working with the database](#working-with-the-database).

```
                     scraper/main.py
                     scrape, convert, check
                              |
                              v
                     scraper/data/*.json
                              |
              +---------------------------------+
              |                                 |
           --load                       --upsync
              |                                 |
              v                                 v
      Cloudflare D1                    src/data/api/*.json
      (live database)                  (committed to git)
              |                                 |
              |                                 |  git commit + push
              |                                 v
              |                           yarn build
              |                     (json-source.ts reads it)
              |                                 |
              v                                 v
   edge/get-module-snapshot.ts        prerendered pages +
                                       public/data/api/*.json
   ONE route, live per request:       (client bulk fetch)
   /mods/:code/:year/:sem
   (historic offerings only)          everything else on the site
```

`--load` and `--upsync` are independent writes of the same scraped output —
one does not imply the other. Skipping `--upsync` (or the commit+push after
it) means D1 has the new semester but the rest of the site doesn't.

The scraper lives in `scraper/`. CLI flags, publishing semantics (`--load`'s
replace-not-merge behaviour, the shrink guard), data invariants and the
per-semester checklist are in **[scraper/README.md](scraper/README.md)**;
the step-by-step refresh procedure for agents is [AGENTS.md](AGENTS.md).
The short version:

```bash
cd scraper && python3 main.py --refetch --load --upsync   # latest semester -> D1 + src/data/api
```

### Working with the database

```bash
yarn db:build     # Rebuild the local SQLite file from src/data/api
yarn db:pull      # Download the database from D1 instead (needs wrangler auth)
yarn db:verify    # Assert the database reproduces every JSON file exactly
yarn db:dump      # Emit SQL for `wrangler d1 execute --file`
yarn data         # Regenerate the static artifacts the client fetches
```

`yarn dev` and `yarn build` both run `yarn data` first, which reads
`src/data/api` directly and regenerates `public/data/api/` — neither this nor
prerendering touches D1 or `db/*.sqlite` at all. That file is only for the
`db:*` scripts above: staging a load before it's applied to D1, and verifying
D1 matches the JSON.

### The current semester

The current semester is derived, not configured: it is the newest semester
that actually has offerings, ordered by sort key — from `src/data/api` for
prerendered pages and the client, from D1 for the on-demand route. There is
nothing to edit when a new semester arrives — publish it (see above) and
rebuild.

Semester codes follow the format `{year};{semester}` where semester is `1`, `2`,
`S` (Special Term), or `T` (Special Term II). `sort_key` is
`int(year) * 10 + {1:1, 2:2, S:3, T:4}`, computed from the code — never from the
portal's list order, which is not self-consistent (AY2025 lists `2,1,S` while
AY2024 lists `1,2,S`).

## Maintenance

The following tasks must be performed manually at the start of each semester.

### Each Semester

#### 1. Scrape and publish the new semester's data

See [scraper/README.md § Maintenance](scraper/README.md#maintenance) for the
full checklist (running the pipeline, publishing to D1 and `src/data/api`,
and adding the exam timetable once released).

#### 2. Update ICS start date

Update `MIN_DATE` in [`src/lib/get-ics.ts`](src/lib/get-ics.ts) to the **Monday of Week 1** of the new semester:

```ts
const MIN_DATE = new Date("YYYY-MM-DD")
```

This date is used to calculate recurring calendar events in `.ics` exports. The correct date can be found in the NTU academic calendar.

### Each Academic Year

#### 3. Update banner and landing page

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
