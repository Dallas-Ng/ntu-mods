"use client"

import { useMemo } from "react"
import { useBoundState } from "@/state/bound.state"

import {
  customCoursesToAllIndexes,
  customCoursesToIndexMap
} from "@/lib/custom-course-to-index"
import { useCustomCourses } from "@/hooks/use-custom-courses"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"

const NO_HIDDEN = new Set<string>()

/**
 * Module keys hidden on the stored plan being viewed. Shared links and other
 * snapshots (an argument timetable) never hide anything: hidden flags belong to
 * the visitor's own saved plans.
 */
export const resolveHiddenModules = (
  timetables: Timetable[],
  timetableIndex: number,
  timetable: Timetable,
  hiddenModules: string[][] | undefined
): Set<string> => {
  if (timetables[timetableIndex] !== timetable) return NO_HIDDEN
  const list = hiddenModules?.[timetableIndex]
  return list?.length ? new Set(list) : NO_HIDDEN
}

const useHiddenModules = (timetable: Timetable): Set<string> => {
  const timetables = useBoundState((s) => s.timetables)
  const timetableIndex = useBoundState((s) => s.timetableIndex)
  const hiddenModules = useBoundState((s) => s.hiddenModules)

  return useMemo(
    () =>
      resolveHiddenModules(
        timetables,
        timetableIndex,
        timetable,
        hiddenModules
      ),
    [timetables, timetableIndex, timetable, hiddenModules]
  )
}

export const useTimetableIndexes = (
  timetable: Timetable,
  year: string,
  semester: string
) => {
  const { indexes: seasonIndexes, isLoading } = useSeasonIndexes(year, semester)
  const { customCourses: currentCustomCourses } = useCustomCourses()
  const hiddenModules = useHiddenModules(timetable)

  const allModuleIndexes = useMemo(() => {
    const result: Record<string, Record<string, Index[]>> = {}
    for (const code of Object.keys(timetable)) {
      if (hiddenModules.has(code)) continue
      const moduleIndexes = seasonIndexes[code]
      if (moduleIndexes && Object.keys(moduleIndexes).length > 0) {
        result[code] = moduleIndexes
      }
    }
    // Custom block variants are pickable on the grid too
    Object.assign(result, customCoursesToAllIndexes(currentCustomCourses))
    return result
  }, [timetable, seasonIndexes, currentCustomCourses, hiddenModules])

  const moduleIndexMap = useMemo<TimetableWithIndex>(() => {
    const map: TimetableWithIndex = {}
    for (const [code, indexKey] of Object.entries(timetable)) {
      if (hiddenModules.has(code)) continue
      const slots = seasonIndexes[code]?.[indexKey]
      if (slots?.length) map[code] = slots
    }
    // Merge custom courses
    Object.assign(map, customCoursesToIndexMap(currentCustomCourses))
    return map
  }, [timetable, seasonIndexes, currentCustomCourses, hiddenModules])

  return { moduleIndexMap, allModuleIndexes, isLoading }
}
