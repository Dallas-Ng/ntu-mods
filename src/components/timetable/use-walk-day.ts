"use client"

import { useEffect, useMemo, useState } from "react"

import { latestSemester, latestYear } from "@/lib/semesters"
import { loadVenueData, type VenueData } from "@/lib/venue-map"
import { useTimetable } from "@/hooks/use-timetable"
import { useTimetableIndexes } from "@/hooks/use-timetable-indexes"
import type { Focus } from "@/components/map/campus-map"
import { useDayRoute } from "@/components/map/day-route"

const todayNumber = () => new Date().getDay() || 7

/**
 * One day of the plan on the map. Venue data and walks load only once
 * `enabled`; walks are cached by `fetchWalk`, so the preview and the dialog
 * share them.
 */
export const useWalkDay = (enabled: boolean, selected?: string) => {
  const { timetable } = useTimetable()
  const { moduleIndexMap, isLoading } = useTimetableIndexes(
    timetable,
    latestYear,
    latestSemester
  )
  const [data, setData] = useState<VenueData | null>(null)
  useEffect(() => {
    if (enabled) loadVenueData().then(setData)
  }, [enabled])

  const busyDays = useMemo(() => {
    const s = new Set<number>()
    for (const slots of Object.values(moduleIndexMap))
      for (const slot of slots) s.add(slot.day)
    return s
  }, [moduleIndexMap])

  // Today if it has classes, else the first day that does.
  const [picked, setPicked] = useState<number>()
  const day =
    picked ??
    (busyDays.has(todayNumber())
      ? todayNumber()
      : ([1, 2, 3, 4, 5, 6, 7].find((d) => busyDays.has(d)) ?? 1))

  const route = useDayRoute(data, moduleIndexMap, day, selected)
  const { pins } = route

  const focus: Focus | null = useMemo(() => {
    if (!pins.length) return null
    const xs = pins.map((p) => p.x)
    const ys = pins.map((p) => p.y)
    const pad = 80
    return {
      bounds: [
        Math.min(...xs) - pad,
        Math.min(...ys) - pad,
        Math.max(...xs) + pad,
        Math.max(...ys) + pad
      ],
      nonce: day * 1000 + pins.length
    }
  }, [pins, day])

  return {
    loading: !data || isLoading,
    data,
    busyDays,
    day,
    setDay: setPicked,
    focus,
    ...route
  }
}
