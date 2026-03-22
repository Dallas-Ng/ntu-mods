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

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
- **State:** Zustand
- **Data:** Static JSON files (scraped from NTU STARS)
- **Database:** Vercel Postgres (for feedback)
- **Deployment:** Vercel

## Project Structure

```
├── app/                    # Next.js App Router pages and API routes
│   ├── mods/               # Module browser and individual module pages
│   ├── timetable/          # Timetable builder
│   ├── share/              # Shared timetable view
│   ├── screenshot/         # Screenshot-optimised timetable view
│   └── api/                # API routes serving module/index data
├── src/
│   ├── components/         # React components
│   ├── data/api/           # Static JSON data (modules, indexes, exams)
│   ├── hooks/              # React hooks
│   ├── lib/                # Utility functions and server helpers
│   └── types/              # Global TypeScript types
└── scripts/                # Data pipeline (scrapers + transforms)
    └── scrapers/           # Python scrapers for NTU STARS data
```

## Getting Started

### Prerequisites

- Node.js 18+
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

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
yarn build
yarn start
```

## Data Pipeline

Module and index data is sourced from NTU STARS and stored as static JSON in `src/data/api/`. The pipeline runs in order:

```
scripts/scrapers/
  1_academic_year.py   # Fetch available academic years
  2_course.py          # Fetch course codes per year
  3_module.py          # Fetch module metadata (title, AUs, prerequisites)
  4_indexes.py         # Fetch class indexes and schedules
  5_exams.py           # Fetch exam timetables
```

After scraping, run the transform script to produce the final JSON format consumed by the app:

```bash
node scripts/transform-api-data.js
```

### Updating the Current Semester

The current semester is controlled by the first entry in [`src/data/api/semesters.json`](src/data/api/semesters.json). When a new semester is available, add it to the top of the array:

```json
[
  { "code": "2026;1", "name": "Acad Yr 2026 Semester 1" },
  ...
]
```

Semester codes follow the format `{year};{semester}` where semester is `1`, `2`, `S` (Special Term), or `T` (Special Term II).

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

Then re-run step 5 of the scraper (`5_exams.py`) to convert it to JSON.

#### 3. Update `semesters.json`

Add the new semester to the top of [`src/data/api/semesters.json`](src/data/api/semesters.json) (see [Updating the Current Semester](#updating-the-current-semester)).

#### 4. Update ICS start date

Update `MIN_DATE` in [`src/lib/get-ics.ts`](src/lib/get-ics.ts) to the **Monday of Week 1** of the new semester:

```ts
const MIN_DATE = new Date("YYYY-MM-DD");
```

This date is used to calculate recurring calendar events in `.ics` exports. The correct date can be found in the NTU academic calendar.

### Each Academic Year

#### 5. Update banner and landing page

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
