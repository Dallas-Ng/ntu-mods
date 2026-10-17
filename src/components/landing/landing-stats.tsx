import { ChevronRight } from "lucide-react"

import { formatCount } from "@/lib/format"

import type { SemesterStats } from "./landing-stats-data"

interface Props {
  semesterLabel: string
  stats: SemesterStats
}

const TILE =
  "group flex min-h-44 flex-col justify-between gap-6 rounded-2xl p-6 transition-colors duration-150 md:p-7"

// What this semester's data holds, each number linking to where to use it.
const LandingStats = ({ semesterLabel, stats }: Props) => {
  const tiles = [
    {
      value: stats.modules,
      label: "Modules",
      note: "Offered this semester",
      href: "/mods",
      tone: "bg-muted hover:bg-accent"
    },
    {
      value: stats.newModules,
      label: "New modules",
      note: "Offered for the first time",
      href: "/articles/ntu-ay2026-semester-2-whats-new",
      tone: "bg-primary text-primary-foreground hover:bg-primary/90"
    },
    {
      value: stats.bdeModules,
      label: "BDE modules",
      note: "Broadening and Deepening Electives",
      href: "/articles/complete-ntu-bde-list",
      tone: "bg-muted hover:bg-accent"
    },
    {
      value: stats.indexes,
      label: "Class indexes",
      note: "Tutorial and lab groups to pick from",
      href: "/timetable",
      tone: "bg-muted hover:bg-accent"
    }
  ]

  return (
    <section
      aria-label={`${semesterLabel} data`}
      className="mx-auto max-w-7xl px-4">
      <p className="mb-4 text-xl font-semibold">
        What is in{" "}
        {semesterLabel.replace(
          /^AY(\d{4})/,
          (_, y) => `AY${y}/${String(Number(y) + 1).slice(2)}`
        )}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <a
            key={t.label}
            href={t.href}
            className={`${TILE} ${t.tone} landing-reveal`}>
            <p className="text-6xl leading-none font-bold tracking-tighter">
              {formatCount(t.value)}
            </p>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xl font-semibold">{t.label}</p>
                <p className="text-base">{t.note}</p>
              </div>
              <ChevronRight
                aria-hidden="true"
                className="size-6 shrink-0 transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none"
              />
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

export default LandingStats
