import { useEffect, useState } from "react"

import { getIndexTypeStyle } from "@/lib/get-index-type-style"

import { Button } from "../ui/button"

// [day 0-4, start hour, hours long, index type]
type Block = [number, number, number, string]

const FIRST_HOUR = 8
const HOURS = 10
const HOUR_LABELS = [9, 11, 13, 15, 17]

const hourLabel = (h: number) =>
  h === 12 ? "12PM" : h > 12 ? `${h - 12}PM` : `${h}AM`
const pct = (h: number) => `${((h - FIRST_HOUR) / HOURS) * 100}%`

const VARIATIONS: {
  title: string
  body: string
  blocks: Block[]
  // The time the constraint rules out: days [from, to), hours [from, to)
  off: { days: [number, number]; hours: [number, number]; label: string }
}[] = [
  {
    off: { days: [4, 5], hours: [8, 18], label: "Free" },
    title: "Make Friday free",
    body: "Tell the planner which days you want off and pick from every timetable that works.",
    blocks: [
      [0, 9, 3, "LEC"],
      [0, 12, 2, "TUT"],
      [0, 14, 3, "LAB"],
      [1, 9, 2, "SEM"],
      [1, 11, 3, "LEC"],
      [1, 15, 2, "TUT"],
      [2, 9, 3, "LEC"],
      [2, 12, 3, "LAB"],
      [3, 9, 2, "TUT"],
      [3, 11, 3, "LEC"],
      [3, 14, 2, "SEM"]
    ]
  },
  {
    off: { days: [0, 5], hours: [13, 18], label: "No afternoon classes" },
    title: "No afternoon classes",
    body: "Keep everything before lunch and have the rest of the day to yourself.",
    blocks: [
      [0, 9, 2, "LEC"],
      [0, 11, 2, "TUT"],
      [1, 9, 3, "LAB"],
      [2, 8, 2, "SEM"],
      [2, 10, 3, "LEC"],
      [3, 9, 2, "TUT"],
      [3, 11, 2, "LEC"],
      [4, 9, 3, "LEC"]
    ]
  },
  {
    off: { days: [3, 5], hours: [8, 18], label: "Free" },
    title: "Mon to Wed only",
    body: "Squeeze the week into three days and keep Thursday and Friday clear.",
    blocks: [
      [0, 9, 3, "LEC"],
      [0, 12, 2, "TUT"],
      [0, 14, 3, "LAB"],
      [1, 9, 2, "SEM"],
      [1, 11, 3, "LEC"],
      [1, 14, 2, "TUT"],
      [2, 9, 3, "LEC"],
      [2, 12, 3, "LAB"],
      [2, 15, 2, "DES"]
    ]
  },
  {
    off: { days: [0, 5], hours: [8, 10], label: "Sleep in" },
    title: "No 8:30 mornings",
    body: "Start at 10 or later, every day of the week.",
    blocks: [
      [0, 10, 3, "LEC"],
      [0, 13, 2, "TUT"],
      [1, 10, 2, "LAB"],
      [1, 12, 3, "LEC"],
      [2, 10, 2, "SEM"],
      [2, 13, 2, "TUT"],
      [2, 15, 2, "LEC"],
      [3, 10, 3, "LEC"],
      [3, 13, 2, "LAB"],
      [4, 10, 3, "PRJ"]
    ]
  },
  {
    off: { days: [0, 5], hours: [12, 14], label: "Lunch" },
    title: "A proper lunch break",
    body: "Keep 12 to 2 clear so you can actually sit down and eat.",
    blocks: [
      [0, 9, 3, "LEC"],
      [0, 14, 2, "TUT"],
      [1, 9, 3, "LAB"],
      [1, 14, 3, "LEC"],
      [2, 9, 2, "SEM"],
      [2, 14, 2, "TUT"],
      [3, 9, 3, "LEC"],
      [3, 14, 2, "LAB"],
      [4, 9, 3, "LEC"],
      [4, 14, 2, "TUT"]
    ]
  }
]

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const CYCLE_MS = 5000

// The planner's constraints, cycled through as weeks drawn with the same
// colours the timetable uses. The ruled-out time is marked and named.
const LandingCloser = () => {
  const [selected, setSelected] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(
      () => setSelected((i) => (i + 1) % VARIATIONS.length),
      CYCLE_MS
    )
    return () => window.clearInterval(id)
  }, [paused])

  const v = VARIATIONS[selected]
  const span = (h: [number, number]) => ((h[1] - h[0]) / HOURS) * 100

  return (
    <section
      className="mx-auto mb-12 max-w-7xl px-4 md:mb-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>
      <div className="bg-muted grid gap-10 rounded-3xl p-6 md:p-12 lg:grid-cols-[5fr_6fr] lg:items-center">
        <div>
          <h2
            key={v.title}
            aria-live="polite"
            className="animate-in fade-in slide-in-from-bottom-2 min-h-[1.9em] text-5xl leading-[0.95] font-bold tracking-tighter duration-300 md:text-6xl">
            {v.title}
          </h2>
          <p className="mt-6 min-h-14 max-w-md text-lg">{v.body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 px-8 text-base active:scale-[0.98]"
              asChild>
              <a href="/timetable">Build my timetable</a>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="bg-background hover:bg-accent h-12 px-8 text-base active:scale-[0.98]"
              asChild>
              <a href="/mods">Browse modules</a>
            </Button>
          </div>
          <div className="mt-8 flex gap-1">
            {VARIATIONS.map((x, i) => (
              <button
                key={x.title}
                type="button"
                aria-label={x.title}
                aria-pressed={i === selected}
                onClick={() => setSelected(i)}
                className="flex h-6 items-center px-1">
                <span
                  className={`block h-2.5 rounded-full transition-[width,background-color] duration-300 ${
                    i === selected ? "bg-primary w-8" : "bg-foreground/25 w-2.5"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="bg-background rounded-2xl p-4 md:p-6">
          <div className="mb-3 grid grid-cols-5 pl-12">
            {DAYS.map((d) => (
              <p key={d} className="px-2 text-sm font-semibold">
                {d}
              </p>
            ))}
          </div>

          <div className="relative h-72 pl-12 md:h-80">
            {HOUR_LABELS.map((h) => (
              <span
                key={h}
                className="text-muted-foreground absolute left-0 -translate-y-1/2 text-sm"
                style={{ top: pct(h) }}>
                {hourLabel(h)}
              </span>
            ))}

            <div className="bg-muted/50 relative grid h-full grid-cols-5 overflow-hidden rounded-lg">
              {DAYS.map((d, day) => (
                <div key={d} className="relative">
                  {v.blocks
                    .filter((b) => b[0] === day)
                    .map(([, start, len, type]) => {
                      const style = getIndexTypeStyle(type)
                      return (
                        <div
                          key={`${selected}-${start}-${type}`}
                          style={{
                            top: `calc(${pct(start)} + 2px)`,
                            height: `calc(${(len / HOURS) * 100}% - 4px)`
                          }}
                          className={`animate-in fade-in absolute inset-x-0.5 overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-[13px] leading-tight font-semibold duration-500 ${style.background} ${style.text} ${style.borderLeft}`}>
                          <p>{type}</p>
                        </div>
                      )
                    })}
                </div>
              ))}

              <div
                key={`off-${selected}`}
                className="animate-in fade-in absolute duration-500"
                style={{
                  left: `${v.off.days[0] * 20}%`,
                  width: `${(v.off.days[1] - v.off.days[0]) * 20}%`,
                  top: pct(v.off.hours[0]),
                  height: `${span(v.off.hours)}%`
                }}>
                <div className="bg-muted flex h-full items-center justify-center px-3 text-center text-lg font-bold">
                  {v.off.label}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LandingCloser
