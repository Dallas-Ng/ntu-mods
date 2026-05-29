"use client"

import { useEffect, useRef, useState } from "react"
import { useBoundState } from "@/state/bound.state"

import { STARS_TIMESLOTS, TRUN_DAY_MAP } from "@/lib/constants"
import { formatHhmm } from "@/lib/format"

const WEEKDAYS = [1, 2, 3, 4, 5] as const

const TIME_LABELS = STARS_TIMESLOTS.filter(
  (t) => t.start >= 800 && t.start <= 2000
).map((t) => ({
  start: t.start,
  end: t.end,
  label: formatHhmm(t.start)
}))

function toKey(day: number, start: number) {
  return `${day}-${start}`
}

// Walk up DOM to find element with data-row + data-col
function getCellIdx(
  el: Element | null
): { rowIdx: number; colIdx: number } | null {
  let cur = el
  while (cur && cur !== document.body) {
    const row = (cur as HTMLElement).dataset?.row
    const col = (cur as HTMLElement).dataset?.col
    if (row !== undefined && col !== undefined) {
      return { rowIdx: parseInt(row), colIdx: parseInt(col) }
    }
    cur = cur.parentElement
  }
  return null
}

const TimetableBlacklistEditor = () => {
  const blacklistedTimeslots = useBoundState(
    (s) => s.generationConfig.blacklistedTimeslots
  )
  const updateGenerationConfig = useBoundState((s) => s.updateGenerationConfig)

  const isDragging = useRef(false)
  const dragMode = useRef(true)
  const pendingKeys = useRef<Set<string>>(new Set())
  const lastCell = useRef<{ rowIdx: number; colIdx: number } | null>(null)

  const [, forceRender] = useState(0)
  const bump = () => forceRender((n) => n + 1)

  const activeKeys: Set<string> = isDragging.current
    ? pendingKeys.current
    : new Set(blacklistedTimeslots.map((bl) => toKey(bl.day, bl.startTime)))

  const applyIdx = (rowIdx: number, colIdx: number) => {
    if (rowIdx < 0 || rowIdx >= TIME_LABELS.length) return
    if (colIdx < 0 || colIdx >= WEEKDAYS.length) return
    const key = toKey(WEEKDAYS[colIdx], TIME_LABELS[rowIdx].start)
    if (dragMode.current) {
      pendingKeys.current.add(key)
    } else {
      pendingKeys.current.delete(key)
    }
  }

  // Bresenham-style interpolation: fill all cells between two grid positions
  const interpolate = (
    from: { rowIdx: number; colIdx: number },
    to: { rowIdx: number; colIdx: number }
  ) => {
    const dRow = to.rowIdx - from.rowIdx
    const dCol = to.colIdx - from.colIdx
    const steps = Math.max(Math.abs(dRow), Math.abs(dCol), 1)
    for (let i = 1; i <= steps; i++) {
      const r = Math.round(from.rowIdx + (dRow * i) / steps)
      const c = Math.round(from.colIdx + (dCol * i) / steps)
      applyIdx(r, c)
    }
  }

  const handleMouseDown = (
    rowIdx: number,
    colIdx: number,
    e: React.MouseEvent
  ) => {
    e.preventDefault()
    isDragging.current = true
    lastCell.current = { rowIdx, colIdx }

    // Seed from current Zustand state
    pendingKeys.current = new Set(
      blacklistedTimeslots.map((bl) => toKey(bl.day, bl.startTime))
    )

    const key = toKey(WEEKDAYS[colIdx], TIME_LABELS[rowIdx].start)
    dragMode.current = !pendingKeys.current.has(key)
    applyIdx(rowIdx, colIdx)
    bump()
  }

  // mousemove on window — catches fast moves that skip onMouseEnter
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const cur = getCellIdx(el)
      if (!cur) return

      const last = lastCell.current
      if (last) {
        if (cur.rowIdx !== last.rowIdx || cur.colIdx !== last.colIdx) {
          interpolate(last, cur)
          bump()
        }
      }
      lastCell.current = cur
    }

    const handleMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      lastCell.current = null

      const result = Array.from(pendingKeys.current)
        .map((key) => {
          const [day, start] = key.split("-").map(Number)
          const slot = TIME_LABELS.find((t) => t.start === start)
          if (!slot) return null
          return { day, startTime: slot.start, endTime: slot.end }
        })
        .filter((v): v is NonNullable<typeof v> => v !== null)

      updateGenerationConfig({ blacklistedTimeslots: result })
      bump()
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateGenerationConfig, blacklistedTimeslots])

  const clearAll = () => updateGenerationConfig({ blacklistedTimeslots: [] })

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table
          className="w-full text-xs select-none"
          onDragStart={(e) => e.preventDefault()}>
          <thead>
            <tr>
              <th className="text-muted-foreground w-12 pr-2 pb-1 text-right font-normal" />
              {WEEKDAYS.map((d) => (
                <th
                  key={d}
                  className="text-muted-foreground pb-1 text-center font-normal">
                  {TRUN_DAY_MAP[d as keyof typeof TRUN_DAY_MAP]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_LABELS.map((t, rowIdx) => (
              <tr key={t.start}>
                <td className="text-muted-foreground pr-2 text-right tabular-nums">
                  {t.label}
                </td>
                {WEEKDAYS.map((day, colIdx) => {
                  const active = activeKeys.has(toKey(day, t.start))
                  return (
                    <td key={day} className="px-0.5 py-0.5">
                      <div
                        role="button"
                        aria-pressed={active}
                        aria-label={`${active ? "Unblock" : "Block"} ${TRUN_DAY_MAP[day as keyof typeof TRUN_DAY_MAP]} ${t.label}`}
                        data-row={rowIdx}
                        data-col={colIdx}
                        onMouseDown={(e) => handleMouseDown(rowIdx, colIdx, e)}
                        className={`h-5 w-full cursor-pointer rounded-sm transition-colors ${
                          active
                            ? "bg-destructive"
                            : "bg-muted hover:bg-muted-foreground/30"
                        }`}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {blacklistedTimeslots.length > 0 && (
        <button
          onClick={clearAll}
          className="text-muted-foreground hover:text-foreground self-end text-xs underline transition-colors">
          Clear all
        </button>
      )}
    </div>
  )
}

export default TimetableBlacklistEditor
