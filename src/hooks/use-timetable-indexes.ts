"use client"

import { useEffect, useMemo, useState } from "react"

type AllModuleIndexes = Record<string, Record<string, Index[]>>

export const useTimetableIndexes = (
  timetable: Timetable,
  year: string,
  semester: string
) => {
  const [allModuleIndexes, setAllModuleIndexes] = useState<AllModuleIndexes>({})
  const [isLoading, setIsLoading] = useState(false)

  const modulesKey = useMemo(
    () => Object.keys(timetable).sort().join(","),
    [timetable]
  )

  useEffect(() => {
    if (!modulesKey) {
      setAllModuleIndexes({})
      return
    }

    const controller = new AbortController()
    setIsLoading(true)

    const params = new URLSearchParams({ modules: modulesKey, year, semester })
    fetch(`/api/data/indexes/batch?${params}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: AllModuleIndexes) => setAllModuleIndexes(data))
      .catch(() => {})
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [modulesKey, year, semester])

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
