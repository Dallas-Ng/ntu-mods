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

## Contributing

Contributions are welcome. Please open an issue first to discuss any significant changes.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Open a pull request

## License

Licensed under the [MIT license](https://github.com/Dallas-Ng/ntu-mods/blob/main/LICENSE.txt).
