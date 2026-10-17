import { useEffect, useState } from "react"

import { TimetableTable } from "../timetable-table/table"
import type { DemoPersona } from "./landing-demo-data"

const CYCLE_MS = 7000

// Real timetables for kinds of student. Cycles on its own until the visitor
// takes over with the arrows.
const LandingDemo = ({ personas }: { personas: DemoPersona[] }) => {
  const [selected, setSelected] = useState(0)
  const [auto, setAuto] = useState(true)
  // Full cell detail needs room; phones get the compact cells
  const [roomy, setRoomy] = useState(true)
  const count = personas.length

  useEffect(() => {
    if (!auto || count < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(
      () => setSelected((i) => (i + 1) % count),
      CYCLE_MS
    )
    return () => window.clearInterval(id)
  }, [auto, count])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const sync = () => setRoomy(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  const current = personas[selected]
  if (!current) return null

  const go = (step: number) => {
    setAuto(false)
    setSelected((i) => (i + step + count) % count)
  }

  const button =
    "bg-background hover:bg-accent h-11 rounded-md px-5 text-base font-semibold transition-[background-color,transform] duration-150 active:scale-[0.97]"

  return (
    <div className="bg-muted/60 rounded-3xl p-3 md:p-6">
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
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className={button}
            onClick={() => go(-1)}
            aria-label="Previous student">
            ←
          </button>
          <button type="button" className={button} onClick={() => go(1)}>
            Next student →
          </button>
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
