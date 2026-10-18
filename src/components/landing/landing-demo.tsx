import { useEffect, useState } from "react"

import { TimetableTable } from "../timetable-table/table"
import LandingCarouselControls from "./landing-carousel-controls"
import type { DemoPersona } from "./landing-demo-data"

const CYCLE_MS = 7000

// Real timetables for kinds of student. A ring around the next button counts
// down to the next one until the visitor clicks an arrow.
const LandingDemo = () => {
  const [personas, setPersonas] = useState<DemoPersona[]>([])
  const [selected, setSelected] = useState(0)
  // Stops for good once the visitor uses the arrows
  const [stopped, setStopped] = useState(false)
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
      <div className="bg-muted rounded-3xl p-5 md:p-6">
        <div className="mb-4 h-[4.25rem]" />
        <div className="bg-background h-[56vh] min-h-[360px] w-full rounded-2xl" />
      </div>
    )
  }

  const step = (by: number) => setSelected((i) => (i + by + count) % count)
  const go = (by: number) => {
    setStopped(true)
    step(by)
  }
  const auto = !stopped && count > 1

  return (
    <div className="bg-muted rounded-3xl p-5 md:p-6">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="md:order-last md:pt-1">
          <LandingCarouselControls
            index={selected}
            total={count}
            prevLabel="Previous student"
            nextLabel="Next student"
            onPrev={() => go(-1)}
            onNext={() => go(1)}
            ring={
              auto
                ? {
                    turnKey: current.id,
                    durationMs: CYCLE_MS,
                    onDone: () => step(1)
                  }
                : undefined
            }
          />
        </div>
        <div aria-live="polite" className="min-w-0">
          <p
            key={current.id}
            className="animate-in fade-in slide-in-from-bottom-2 text-xl leading-tight font-bold tracking-tight duration-300 md:text-2xl">
            {current.label}
          </p>
          <p className="mt-2 text-sm md:text-base">
            {Object.keys(current.timetable).length} modules · {current.note}
            {current.bdes.length > 0 &&
              `, incl. ${current.bdes.length} BDE${current.bdes.length > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div
        key={current.id}
        className="bg-background animate-in fade-in h-[56vh] min-h-[360px] w-full overflow-hidden rounded-2xl duration-500">
        <TimetableTable moduleIndexMap={current.timetable} fullCell={roomy} />
      </div>
    </div>
  )
}

export default LandingDemo
