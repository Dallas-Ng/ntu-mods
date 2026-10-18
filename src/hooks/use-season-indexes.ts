"use client"

import { useEffect, useState } from "react"

import { reportError } from "@/lib/analytics"

export type SeasonIndexes = Record<string, Record<string, Index[]>>

const cache = new Map<string, SeasonIndexes>()
const pending = new Map<string, Promise<SeasonIndexes>>()

export function fetchSeasonIndexes(
  year: string,
  semester: string
): Promise<SeasonIndexes> {
  const key = `${year}_${semester}`
  if (cache.has(key)) return Promise.resolve(cache.get(key)!)
  if (pending.has(key)) return pending.get(key)!

  const promise = fetch(`/data/api/indexes/${key}.json`)
    .then((res) => {
      // 404: this semester has no file yet. Empty, not an error.
      if (res.status === 404) return {}
      if (!res.ok) throw new Error(`indexes ${res.status}`)
      return res.json()
    })
    .then((data: SeasonIndexes) => {
      cache.set(key, data)
      pending.delete(key)
      return data
    })
    .catch((e) => {
      reportError("indexes_fetch", e, { year, semester })
      pending.delete(key)
      return {} as SeasonIndexes
    })

  pending.set(key, promise)
  return promise
}

export function useSeasonIndexes(
  year: string,
  semester: string,
  enabled = true
) {
  const key = `${year}_${semester}`
  const [indexes, setIndexes] = useState<SeasonIndexes>(
    () => cache.get(key) ?? {}
  )
  const [isLoading, setIsLoading] = useState(enabled && !cache.has(key))

  useEffect(() => {
    if (!enabled) return
    if (cache.has(key)) {
      setIndexes(cache.get(key)!)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    fetchSeasonIndexes(year, semester).then((data) => {
      setIndexes(data)
      setIsLoading(false)
    })
  }, [key, year, semester, enabled])

  return { indexes, isLoading }
}
