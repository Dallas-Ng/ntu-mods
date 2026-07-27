"use client"

import { useMemo } from "react"

import {
  customCoursesToAllIndexes,
  customCoursesToIndexMap
} from "@/lib/custom-course-to-index"
import { useCustomCourses } from "@/hooks/use-custom-courses"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"

export const useTimetableIndexes = (
  timetable: Timetable,
  year: string,
  semester: string
) => {
  const { indexes: seasonIndexes, isLoading } = useSeasonIndexes(year, semester)
  const { customCourses: currentCustomCourses } = useCustomCourses()

  const allModuleIndexes = useMemo(() => {
    const result: Record<string, Record<string, Index[]>> = {}
    for (const code of Object.keys(timetable)) {
      const moduleIndexes = seasonIndexes[code]
      if (moduleIndexes && Object.keys(moduleIndexes).length > 0) {
        result[code] = moduleIndexes
      }
    }
    // Custom block variants are pickable on the grid too
    Object.assign(result, customCoursesToAllIndexes(currentCustomCourses))
    return result
  }, [timetable, seasonIndexes, currentCustomCourses])

  const moduleIndexMap = useMemo<TimetableWithIndex>(() => {
    const map: TimetableWithIndex = {}
    for (const [code, indexKey] of Object.entries(timetable)) {
      const slots = seasonIndexes[code]?.[indexKey]
      if (slots?.length) map[code] = slots
    }
    // Merge custom courses
    Object.assign(map, customCoursesToIndexMap(currentCustomCourses))
    return map
  }, [timetable, seasonIndexes, currentCustomCourses])

  return { moduleIndexMap, allModuleIndexes, isLoading }
}
