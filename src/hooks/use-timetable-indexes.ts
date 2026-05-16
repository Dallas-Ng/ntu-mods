"use client"

import { useMemo } from "react"

import { useSeasonIndexes } from "@/hooks/use-season-indexes"

export const useTimetableIndexes = (
  timetable: Timetable,
  year: string,
  semester: string
) => {
  const { indexes: seasonIndexes, isLoading } = useSeasonIndexes(year, semester)

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
    return map
  }, [timetable, allModuleIndexes])

  return { moduleIndexMap, allModuleIndexes, isLoading }
}
