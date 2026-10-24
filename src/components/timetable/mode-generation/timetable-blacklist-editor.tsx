"use client"

import { useEffect, useRef, useState } from "react"
import { useBoundState } from "@/state/bound.state"

import { track } from "@/lib/analytics"
import { formatHhmm } from "@/lib/format"
import { STARS_TIMESLOTS, TRUN_DAY_MAP } from "@/lib/module-constants"

const WEEKDAYS = [1, 2, 3, 4, 5] as const

const ALL_TIME_SLOTS = STARS_TIMESLOTS.filter(
  (t) => t.start >= 700 && t.start <= 2200
).map((t) => ({ start: t.start, end: t.end, label: formatHhmm(t.start) }))

function toKey(day: number, start: number) {
  return `${day}-${start}`
}

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
  const config = useBoundState((s) => s.generationConfig)
  const updateGenerationConfig = useBoundState((s) => s.updateGenerationConfig)

  const { blacklistedTimeslots, dayStartTime, dayEndTime, lunchBreaks } = config

  const timeLabels = ALL_TIME_SLOTS.filter(
    (t) => t.start >= dayStartTime && t.end <= dayEndTime
  )

  const constraintKeys = new Set<string>()
  for (const lb of lunchBreaks) {
    for (const t of timeLabels) {
      if (t.start < lb.endTime && t.end > lb.startTime) {
        constraintKeys.add(toKey(lb.day, t.start))
      }
    }
  }

  const isDragging = useRef(false)
  const dragMode = useRef(true)
  const pendingKeys = useRef<Set<string>>(new Set())
  const lastCell = useRef<{ rowIdx: number; colIdx: number } | null>(null)
  const timeLabelsRef = useRef(timeLabels)
  timeLabelsRef.current = timeLabels

  const [, forceRender] = useState(0)
  const bump = () => forceRender((n) => n + 1)

  const activeKeys: Set<string> = isDragging.current
    ? pendingKeys.current
    : new Set(blacklistedTimeslots.map((bl) => toKey(bl.day, bl.startTime)))

  const applyIdx = (rowIdx: number, colIdx: number) => {
    const tl = timeLabelsRef.current
    if (rowIdx < 0 || rowIdx >= tl.length) return
    if (colIdx < 0 || colIdx >= WEEKDAYS.length) return
    const key = toKey(WEEKDAYS[colIdx], tl[rowIdx].start)
    if (dragMode.current) {
      pendingKeys.current.add(key)
    } else {
      pendingKeys.current.delete(key)
    }
  }

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

  const startDrag = (rowIdx: number, colIdx: number) => {
    isDragging.current = true
    lastCell.current = { rowIdx, colIdx }
    pendingKeys.current = new Set(
      blacklistedTimeslots.map((bl) => toKey(bl.day, bl.startTime))
    )
    const key = toKey(WEEKDAYS[colIdx], timeLabelsRef.current[rowIdx].start)
    dragMode.current = !pendingKeys.current.has(key)
    applyIdx(rowIdx, colIdx)
    bump()
  }

  const handleMouseDown = (
    rowIdx: number,
    colIdx: number,
    e: React.MouseEvent
  ) => {
    e.preventDefault()
    startDrag(rowIdx, colIdx)
  }

  const handleTouchStart = (
    rowIdx: number,
    colIdx: number,
    e: React.TouchEvent
  ) => {
    e.preventDefault()
    startDrag(rowIdx, colIdx)
  }

  const commitPending = () => {
    isDragging.current = false
    lastCell.current = null
    const result = Array.from(pendingKeys.current)
      .map((key) => {
        const [day, start] = key.split("-").map(Number)
        const slot = ALL_TIME_SLOTS.find((t) => t.start === start)
        if (!slot) return null
        return { day, startTime: slot.start, endTime: slot.end }
      })
      .filter((v): v is NonNullable<typeof v> => v !== null)
    updateGenerationConfig({ blacklistedTimeslots: result })
    track("timetable_blacklist_changed", { slots: result.length })
    bump()
  }

  const handlePointerMove = (x: number, y: number) => {
    if (!isDragging.current) return
    const el = document.elementFromPoint(x, y)
    const cur = getCellIdx(el)
    if (!cur) return
    const last = lastCell.current
    if (last && (cur.rowIdx !== last.rowIdx || cur.colIdx !== last.colIdx)) {
      interpolate(last, cur)
      bump()
    }
    lastCell.current = cur
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) =>
      handlePointerMove(e.clientX, e.clientY)
    const handleMouseUp = () => {
      if (isDragging.current) commitPending()
    }
    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) handlePointerMove(t.clientX, t.clientY)
    }
    const handleTouchEnd = () => {
      if (isDragging.current) commitPending()
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    updateGenerationConfig,
    blacklistedTimeslots,
    dayStartTime,
    dayEndTime,
    lunchBreaks
  ])

  const clearAll = () => {
    updateGenerationConfig({ blacklistedTimeslots: [] })
    track("timetable_blacklist_changed", { slots: 0, cleared: true })
  }

  const hasUserBlocked = blacklistedTimeslots.length > 0
  const hasConstraints = constraintKeys.size > 0

  return (
    <div className="flex flex-col gap-2">
      {(hasUserBlocked || hasConstraints) && (
        <div className="flex flex-wrap items-center gap-3">
          {hasConstraints && (
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-amber-400/60" />
              <span className="text-muted-foreground text-xs">
                Existing (lunch)
              </span>
            </div>
          )}
          {hasUserBlocked && (
            <div className="flex items-center gap-1.5">
              <div className="bg-destructive h-3 w-3 rounded-sm" />
              <span className="text-muted-foreground text-xs">Blocked</span>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table
          className="w-full table-fixed touch-none text-xs select-none"
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
            {timeLabels.map((t, rowIdx) => (
              <tr key={t.start}>
                <td className="text-muted-foreground pr-2 text-right tabular-nums">
                  {t.label}
                </td>
                {WEEKDAYS.map((day, colIdx) => {
                  const isUserBlocked = activeKeys.has(toKey(day, t.start))
                  const isConstraint = constraintKeys.has(toKey(day, t.start))
                  const interactive = !isConstraint

                  return (
                    <td key={day} className="px-0.5 py-0.5">
                      <div
                        role={interactive ? "button" : undefined}
                        aria-pressed={interactive ? isUserBlocked : undefined}
                        aria-label={
                          interactive
                            ? `${isUserBlocked ? "Unblock" : "Block"} ${TRUN_DAY_MAP[day as keyof typeof TRUN_DAY_MAP]} ${t.label}`
                            : undefined
                        }
                        data-row={interactive ? rowIdx : undefined}
                        data-col={interactive ? colIdx : undefined}
                        onMouseDown={
                          interactive
                            ? (e) => handleMouseDown(rowIdx, colIdx, e)
                            : undefined
                        }
                        onTouchStart={
                          interactive
                            ? (e) => handleTouchStart(rowIdx, colIdx, e)
                            : undefined
                        }
                        className={`h-5 w-full rounded-sm transition-colors ${
                          isUserBlocked
                            ? "bg-destructive cursor-pointer"
                            : isConstraint
                              ? "cursor-default bg-amber-400/60"
                              : "bg-muted hover:bg-muted-foreground/30 cursor-pointer"
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

      <button
        onClick={clearAll}
        disabled={!hasUserBlocked}
        className="text-muted-foreground hover:text-foreground self-end text-xs underline transition-colors disabled:pointer-events-none disabled:opacity-40">
        Clear all
      </button>
    </div>
  )
}

export default TimetableBlacklistEditor
