"use client"

import { useMemo } from "react"
import { useBoundState } from "@/state/bound.state"

import { customCoursesToIndexMap } from "@/lib/custom-course-to-index"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"

export const useTimetableIndexes = (
  timetable: Timetable,
  year: string,
  semester: string
) => {
  const { indexes: seasonIndexes, isLoading } = useSeasonIndexes(year, semester)
  const customCourses = useBoundState((s) => s.customCourses)
  const timetableIndex = useBoundState((s) => s.timetableIndex)

  // Memoized so the `?? []` fallback doesn't hand moduleIndexMap a new array
  // identity on every render when this slot is empty.
  const currentCustomCourses = useMemo(
    () => customCourses[timetableIndex] ?? [],
    [customCourses, timetableIndex]
  )

  const allModuleIndexes = useMemo(() => {
    const result: Record<string, Record<string, Index[]>> = {}
    for (const code of Object.keys(timetable)) {
      const moduleIndexes = seasonIndexes[code]
      if (moduleIndexes && Object.keys(moduleIndexes).length > 0) {
        result[code] = moduleIndexes
      }
    }
    return result
  }, [timetable, seasonIndexes])

  const moduleIndexMap = useMemo<TimetableWithIndex>(() => {
    const map: TimetableWithIndex = {}
    for (const [code, indexKey] of Object.entries(timetable)) {
      const slots = allModuleIndexes[code]?.[indexKey]
      if (slots?.length) map[code] = slots
    }
    // Merge custom courses
    Object.assign(map, customCoursesToIndexMap(currentCustomCourses))
    return map
  }, [timetable, allModuleIndexes, currentCustomCourses])

  return { moduleIndexMap, allModuleIndexes, isLoading }
}
