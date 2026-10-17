import { useState } from "react"

import { CUSTOM_BLOCK_STYLE } from "@/lib/custom-course-colors"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"

import LandingCarouselControls from "./landing-carousel-controls"

// [day 0-4, start hour, hours long, index type, optional custom block name]
type Block = [number, number, number, string, string?]

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
  // Time the constraint rules out: days [from, to), hours [from, to)
  off?: { days: [number, number]; hours: [number, number]; label: string }[]
}[] = [
  {
    off: [{ days: [4, 5], hours: [8, 18], label: "Free" }],
    title: "Make Friday free",
    body: "Pick the days you want off.",
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
    off: [{ days: [0, 5], hours: [13, 18], label: "No afternoon classes" }],
    title: "No afternoon classes",
    body: "Finish by lunch, every day.",
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
    off: [{ days: [3, 5], hours: [8, 18], label: "Free" }],
    title: "Mon to Wed only",
    body: "Thu and Fri stay clear.",
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
    off: [{ days: [0, 5], hours: [8, 10], label: "Sleep in" }],
    title: "No 8:30 mornings",
    body: "Start at 10 or later.",
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
    off: [{ days: [0, 5], hours: [12, 14], label: "Lunch" }],
    title: "A proper lunch break",
    body: "Keep 12 to 2 clear.",
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
  },
  {
    title: "Gym time",
    body: "Workouts go in first.",
    blocks: [
      [0, 9, 2, "CUSTOM", "Arms"],
      [0, 11, 3, "LEC"],
      [0, 14, 2, "TUT"],
      [1, 9, 3, "LAB"],
      [1, 12, 2, "TUT"],
      [1, 16, 2, "CUSTOM", "Chest"],
      [2, 9, 2, "CUSTOM", "Arms"],
      [2, 11, 2, "SEM"],
      [2, 14, 3, "LEC"],
      [3, 9, 3, "LEC"],
      [3, 13, 2, "LAB"],
      [3, 16, 2, "CUSTOM", "Chest"],
      [4, 9, 3, "LEC"],
      [4, 12, 2, "CUSTOM", "Arms"],
      [4, 14, 2, "TUT"]
    ]
  },
  {
    title: "Gaps between classes",
    body: "At least an hour apart.",
    blocks: [
      [0, 9, 2, "LEC"],
      [0, 12, 2, "TUT"],
      [0, 15, 2, "LAB"],
      [1, 10, 2, "SEM"],
      [1, 13, 2, "LEC"],
      [2, 9, 2, "LEC"],
      [2, 12, 2, "TUT"],
      [3, 10, 3, "LAB"],
      [3, 14, 2, "LEC"],
      [4, 9, 2, "LEC"],
      [4, 12, 2, "TUT"]
    ]
  },
  {
    title: "Max 4 hours a day",
    body: "Cap each day at 4 hours.",
    blocks: [
      [0, 9, 2, "LEC"],
      [0, 11, 2, "TUT"],
      [1, 10, 3, "LAB"],
      [2, 9, 2, "SEM"],
      [2, 14, 2, "LEC"],
      [3, 10, 2, "LEC"],
      [3, 13, 2, "TUT"],
      [4, 9, 3, "LEC"]
    ]
  },
  {
    off: [{ days: [2, 3], hours: [15, 18], label: "CCA" }],
    title: "Protect CCA time",
    body: "Plan around blocked slots.",
    blocks: [
      [0, 9, 3, "LEC"],
      [0, 13, 2, "TUT"],
      [1, 9, 3, "LAB"],
      [1, 14, 3, "LEC"],
      [2, 9, 2, "SEM"],
      [2, 12, 2, "TUT"],
      [3, 10, 3, "LEC"],
      [3, 14, 2, "LAB"],
      [4, 9, 3, "LEC"],
      [4, 13, 2, "TUT"]
    ]
  },
  {
    off: [{ days: [0, 5], hours: [16, 18], label: "Home by 4PM" }],
    title: "Home by 4PM",
    body: "Set your latest finish time.",
    blocks: [
      [0, 9, 3, "LEC"],
      [0, 13, 2, "TUT"],
      [1, 9, 3, "LAB"],
      [1, 13, 3, "LEC"],
      [2, 9, 2, "SEM"],
      [2, 11, 2, "TUT"],
      [2, 14, 2, "LEC"],
      [3, 10, 3, "LEC"],
      [3, 14, 2, "LAB"],
      [4, 9, 3, "LEC"],
      [4, 13, 2, "TUT"]
    ]
  }
]

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const CYCLE_MS = 5000

// The planner's constraints, cycled through as weeks drawn with the same
// colours the timetable uses. The ruled-out time is marked and named.
const LandingShowcase = () => {
  const [selected, setSelected] = useState(0)
  // Once the visitor steers it themselves, stop cycling on their behalf
  const [stopped, setStopped] = useState(false)

  const auto = !stopped

  const go = (i: number) =>
    setSelected((i + VARIATIONS.length) % VARIATIONS.length)
  const choose = (i: number) => {
    setStopped(true)
    go(i)
  }

  const v = VARIATIONS[selected]
  const span = (h: [number, number]) => ((h[1] - h[0]) / HOURS) * 100

  return (
    <section className="bg-muted rounded-3xl p-5 md:p-6">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="md:order-last md:pt-1">
          <LandingCarouselControls
            index={selected}
            total={VARIATIONS.length}
            prevLabel="Previous constraint"
            nextLabel="Next constraint"
            onPrev={() => choose(selected - 1)}
            onNext={() => choose(selected + 1)}
            ring={
              auto
                ? {
                    turnKey: selected,
                    durationMs: CYCLE_MS,
                    onDone: () => go(selected + 1)
                  }
                : undefined
            }
          />
        </div>
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
              <h2 className="text-2xl leading-tight font-bold tracking-tight md:text-3xl">
                {x.title}
              </h2>
              <p className="mt-2 max-w-md text-base md:text-lg">{x.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="bg-background rounded-2xl p-3 sm:p-4 md:p-5">
        <div className="mb-3 grid grid-cols-5 sm:pl-12">
          {DAYS.map((d) => (
            <p
              key={d}
              className="text-center text-sm font-semibold sm:px-2 sm:text-left">
              <span className="min-[360px]:hidden sm:hidden">{d[0]}</span>
              <span className="hidden min-[360px]:inline">{d}</span>
            </p>
          ))}
        </div>

        <div className="relative h-64 sm:pl-12 md:h-72">
          <div className="absolute inset-y-1 left-0 hidden w-12 sm:block">
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
                    .map(([, start, len, type, name]) => {
                      const style = name
                        ? CUSTOM_BLOCK_STYLE
                        : getIndexTypeStyle(type)
                      return (
                        <div
                          key={`${selected}-${start}-${type}`}
                          style={{
                            top: `calc(${pct(start)} + 2px)`,
                            height: `calc(${(len / HOURS) * 100}% - 4px)`
                          }}
                          className={`animate-in fade-in absolute inset-x-0.5 overflow-hidden rounded-md px-0 py-1 text-center text-xs leading-tight font-semibold tracking-tight duration-500 min-[360px]:px-1 min-[360px]:text-sm min-[360px]:tracking-normal sm:px-2 sm:text-left ${style.background} ${style.text}`}>
                          <p className="truncate">{name ?? type}</p>
                        </div>
                      )
                    })}
                </div>
              ))}

              {v.off?.map((o) => (
                <div
                  key={`off-${selected}-${o.days[0]}`}
                  className="animate-in fade-in absolute p-0.5 duration-500"
                  style={{
                    left: `${o.days[0] * 20}%`,
                    width: `${(o.days[1] - o.days[0]) * 20}%`,
                    top: pct(o.hours[0]),
                    height: `${span(o.hours)}%`
                  }}>
                  <div className="bg-primary/30 flex h-full items-center justify-center rounded-md px-3 text-center text-sm font-bold text-blue-800 md:text-base dark:text-blue-200">
                    {o.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LandingShowcase
