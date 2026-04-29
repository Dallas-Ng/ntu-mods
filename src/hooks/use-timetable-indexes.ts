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

    const codes = modulesKey.split(",")
    const params = new URLSearchParams({ year, semester })

    Promise.all(
      codes.map((code) =>
        fetch(`/api/data/modules/${code}/indexes?${params}`, {
          signal: controller.signal
        })
          .then((res) => (res.ok ? res.json() : { indexes: {} }))
          .then(
            (data: { indexes: Record<string, Index[]> }) =>
              [code, data.indexes ?? {}] as const
          )
          .catch(() => [code, {}] as const)
      )
    )
      .then((entries) => {
        const result: AllModuleIndexes = {}
        for (const [code, indexes] of entries) {
          if (Object.keys(indexes).length > 0) result[code] = indexes
        }
        setAllModuleIndexes(result)
      })
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
