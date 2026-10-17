import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { TimetableTable } from "../timetable-table/table"
import LandingCircleButton from "./landing-circle-button"
import type { DemoPersona } from "./landing-demo-data"

const CYCLE_MS = 7000

// Real timetables for kinds of student. A ring around the next button counts
// down to the next one, pausing on hover, until the visitor takes over.
const LandingDemo = () => {
  const [personas, setPersonas] = useState<DemoPersona[]>([])
  const [selected, setSelected] = useState(0)
  // Stops for good once the visitor uses the arrows
  const [stopped, setStopped] = useState(false)
  const [paused, setPaused] = useState(false)
  // No autoplay for people who asked for less motion
  const [reduced, setReduced] = useState(true)
  // Full cell detail needs room; phones get the compact cells
  const [roomy, setRoomy] = useState(true)
  const count = personas.length

  // The timetables are a static file, fetched once this section is on screen
  useEffect(() => {
    let cancelled = false
    fetch("/landing-personas.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: DemoPersona[]) => {
        if (!cancelled) setPersonas(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const sync = () => setRoomy(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  const current = personas[selected]
  // Same footprint as the loaded card, so nothing shifts when it arrives
  if (!current) {
    return (
      <div className="bg-muted/60 rounded-3xl p-3 md:p-6">
        <div className="mb-4 h-[4.25rem]" />
        <div className="bg-background h-[56vh] min-h-[360px] w-full rounded-xl" />
      </div>
    )
  }

  const step = (by: number) => setSelected((i) => (i + by + count) % count)
  const go = (by: number) => {
    setStopped(true)
    step(by)
  }
  const auto = !stopped && !reduced && count > 1

  return (
    <div
      className="bg-muted/60 rounded-3xl p-3 md:p-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div aria-live="polite" className="min-w-0">
          <p
            key={current.id}
            className="animate-in fade-in slide-in-from-bottom-2 text-2xl leading-tight font-bold tracking-tight duration-300 md:text-3xl">
            {current.label}
          </p>
          <p className="mt-1 text-base">
            {Object.keys(current.timetable).length} modules · {current.note}
            {current.bdes.length > 0 &&
              `, incl. ${current.bdes.length} BDE${current.bdes.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <p
            aria-hidden="true"
            className="text-muted-foreground hidden text-sm font-semibold tabular-nums sm:block">
            {selected + 1} / {count}
          </p>
          <div className="flex gap-2">
            <LandingCircleButton
              label="Previous student"
              Icon={ChevronLeft}
              onClick={() => go(-1)}
            />
            <LandingCircleButton
              label="Next student"
              Icon={ChevronRight}
              onClick={() => go(1)}
              ring={
                auto
                  ? {
                      turnKey: current.id,
                      durationMs: CYCLE_MS,
                      paused,
                      onDone: () => step(1)
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      <div
        key={current.id}
        className="bg-background animate-in fade-in h-[56vh] min-h-[360px] w-full overflow-hidden rounded-xl duration-500">
        <TimetableTable moduleIndexMap={current.timetable} fullCell={roomy} />
      </div>
    </div>
  )
}

export default LandingDemo
