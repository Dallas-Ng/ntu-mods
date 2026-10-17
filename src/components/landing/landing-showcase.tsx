import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { getIndexTypeStyle } from "@/lib/get-index-type-style"

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
const LandingShowcase = () => {
  const [selected, setSelected] = useState(0)
  const [paused, setPaused] = useState(false)
  // Once the visitor steers it themselves, stop cycling on their behalf
  const [stopped, setStopped] = useState(false)

  useEffect(() => {
    if (paused || stopped) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(
      () => setSelected((i) => (i + 1) % VARIATIONS.length),
      CYCLE_MS
    )
    return () => window.clearInterval(id)
  }, [paused, stopped])

  const choose = (i: number) => {
    setStopped(true)
    setSelected((i + VARIATIONS.length) % VARIATIONS.length)
  }

  const v = VARIATIONS[selected]
  const span = (h: [number, number]) => ((h[1] - h[0]) / HOURS) * 100

  return (
    <section
      className="bg-muted rounded-3xl p-5 md:p-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        {/* Every variation's text sits in one grid cell, so the card is always
            as tall as the longest one and nothing resizes when it changes */}
        <div className="grid">
          {VARIATIONS.map((x, i) => (
            <div
              key={x.title}
              aria-hidden={i !== selected}
              className={`col-start-1 row-start-1 transition-opacity duration-300 motion-reduce:transition-none ${
                i === selected ? "opacity-100" : "pointer-events-none opacity-0"
              }`}>
              <h2 className="text-3xl leading-tight font-bold tracking-tight md:text-4xl">
                {x.title}
              </h2>
              <p className="mt-2 max-w-md text-base md:text-lg">{x.body}</p>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-1">
          <div className="hidden gap-1 sm:flex">
            {VARIATIONS.map((x, i) => (
              <button
                key={x.title}
                type="button"
                aria-label={x.title}
                aria-pressed={i === selected}
                onClick={() => choose(i)}
                className="flex h-6 items-center px-0.5">
                <span
                  className={`block h-2.5 rounded-full transition-[width,background-color] duration-300 ${
                    i === selected ? "bg-primary w-6" : "bg-foreground/25 w-2.5"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {[
              { label: "Previous", step: -1, Icon: ChevronLeft },
              { label: "Next", step: 1, Icon: ChevronRight }
            ].map(({ label, step, Icon }) => (
              <button
                key={label}
                type="button"
                aria-label={`${label} constraint`}
                onClick={() => choose(selected + step)}
                className="bg-background hover:bg-accent flex size-10 items-center justify-center rounded-full transition-[background-color,transform] duration-150 active:scale-[0.94] motion-reduce:transition-none">
                <Icon aria-hidden="true" className="size-5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="bg-background rounded-2xl p-4 md:p-5">
        <div className="mb-3 grid grid-cols-5 pl-12">
          {DAYS.map((d) => (
            <p key={d} className="px-2 text-sm font-semibold">
              {d}
            </p>
          ))}
        </div>

        <div className="relative h-64 pl-12 md:h-72">
          <div className="absolute inset-y-1 left-0 w-12">
            {HOUR_LABELS.map((h) => (
              <span
                key={h}
                className="text-muted-foreground absolute left-0 -translate-y-1/2 text-sm"
                style={{ top: pct(h) }}>
                {hourLabel(h)}
              </span>
            ))}
          </div>

          <div className="bg-muted/50 h-full rounded-md p-1">
            <div className="relative grid h-full grid-cols-5">
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
                          className={`animate-in fade-in absolute inset-x-0.5 overflow-hidden rounded-md px-2 py-1 text-[13px] leading-tight font-semibold duration-500 ${style.background} ${style.text}`}>
                          <p>{type}</p>
                        </div>
                      )
                    })}
                </div>
              ))}

              <div
                key={`off-${selected}`}
                className="animate-in fade-in absolute p-0.5 duration-500"
                style={{
                  left: `${v.off.days[0] * 20}%`,
                  width: `${(v.off.days[1] - v.off.days[0]) * 20}%`,
                  top: pct(v.off.hours[0]),
                  height: `${span(v.off.hours)}%`
                }}>
                <div className="bg-muted flex h-full items-center justify-center rounded-md px-3 text-center text-lg font-bold">
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

export default LandingShowcase
