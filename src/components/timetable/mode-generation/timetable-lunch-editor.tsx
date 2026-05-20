"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound.state"

import { TRUN_DAY_MAP } from "@/lib/constants"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

const LUNCH_TIMES = [
  { value: 1100, label: "11:00" },
  { value: 1130, label: "11:30" },
  { value: 1200, label: "12:00" },
  { value: 1230, label: "12:30" },
  { value: 1300, label: "13:00" },
  { value: 1330, label: "13:30" },
  { value: 1400, label: "14:00" },
  { value: 1430, label: "14:30" },
  { value: 1500, label: "15:00" }
]

const WEEKDAYS = [1, 2, 3, 4, 5] as const

type DayTimes = Record<number, { startTime: number; endTime: number }>

function initFromBreaks(lunchBreaks: LunchBreak[]): {
  enabled: Set<number>
  times: DayTimes
} {
  const enabled = new Set(lunchBreaks.map((lb) => lb.day))
  const times: DayTimes = {}
  WEEKDAYS.forEach((d) => {
    const existing = lunchBreaks.find((lb) => lb.day === d)
    times[d] = existing
      ? { startTime: existing.startTime, endTime: existing.endTime }
      : { startTime: 1200, endTime: 1300 }
  })
  return { enabled, times }
}

const TimetableLunchEditor = () => {
  const lunchBreaks = useBoundState((s) => s.generationConfig.lunchBreaks)
  const updateGenerationConfig = useBoundState((s) => s.updateGenerationConfig)

  // Local state tracks times for ALL days (including disabled) so values persist on toggle
  const [enabled, setEnabled] = useState<Set<number>>(
    () => initFromBreaks(lunchBreaks).enabled
  )
  const [times, setTimes] = useState<DayTimes>(
    () => initFromBreaks(lunchBreaks).times
  )

  const commit = (nextEnabled: Set<number>, nextTimes: DayTimes) => {
    updateGenerationConfig({
      lunchBreaks: Array.from(nextEnabled).map((day) => ({
        day,
        startTime: nextTimes[day].startTime,
        endTime: nextTimes[day].endTime
      }))
    })
  }

  const toggleDay = (day: number) => {
    const next = new Set(enabled)
    if (next.has(day)) {
      next.delete(day)
    } else {
      next.add(day)
    }
    setEnabled(next)
    commit(next, times)
  }

  const updateTime = (
    day: number,
    field: "startTime" | "endTime",
    value: number
  ) => {
    const next = { ...times, [day]: { ...times[day], [field]: value } }
    setTimes(next)
    commit(enabled, next)
  }

  return (
    <div className="flex flex-col gap-2">
      {WEEKDAYS.map((day) => {
        const isEnabled = enabled.has(day)
        const t = times[day]

        return (
          <div key={day} className="flex h-8 items-center gap-2">
            {/* Toggle button */}
            <button
              onClick={() => toggleDay(day)}
              className={`h-5 w-5 shrink-0 rounded-sm border transition-colors ${
                isEnabled
                  ? "bg-foreground border-transparent"
                  : "border-muted-foreground/40 hover:border-foreground"
              }`}
              aria-pressed={isEnabled}
              aria-label={`${isEnabled ? "Disable" : "Enable"} lunch for ${TRUN_DAY_MAP[day as keyof typeof TRUN_DAY_MAP]}`}
            />

            {/* Day label */}
            <span
              className={`w-8 shrink-0 text-xs font-medium transition-opacity ${
                isEnabled ? "opacity-100" : "opacity-40"
              }`}>
              {TRUN_DAY_MAP[day as keyof typeof TRUN_DAY_MAP]}
            </span>

            {/* Start time */}
            <Select
              value={String(t.startTime)}
              onValueChange={(v) => updateTime(day, "startTime", Number(v))}
              disabled={!isEnabled}>
              <SelectTrigger
                className={`h-8 flex-1 text-xs transition-opacity ${
                  isEnabled ? "opacity-100" : "opacity-40"
                }`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LUNCH_TIMES.map((lt) => (
                  <SelectItem key={lt.value} value={String(lt.value)}>
                    {lt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span
              className={`shrink-0 text-xs transition-opacity ${
                isEnabled ? "text-muted-foreground" : "opacity-40"
              }`}>
              to
            </span>

            {/* End time */}
            <Select
              value={String(t.endTime)}
              onValueChange={(v) => updateTime(day, "endTime", Number(v))}
              disabled={!isEnabled}>
              <SelectTrigger
                className={`h-8 flex-1 text-xs transition-opacity ${
                  isEnabled ? "opacity-100" : "opacity-40"
                }`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LUNCH_TIMES.filter((lt) => lt.value > t.startTime).map(
                  (lt) => (
                    <SelectItem key={lt.value} value={String(lt.value)}>
                      {lt.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        )
      })}
    </div>
  )
}

export default TimetableLunchEditor
