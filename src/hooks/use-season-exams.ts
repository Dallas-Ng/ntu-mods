"use client"

import { useEffect, useState } from "react"

export type SeasonExams = Record<string, Exam>

const cache = new Map<string, SeasonExams>()
const pending = new Map<string, Promise<SeasonExams>>()

function fetchSeasonExams(year: string, semester: string): Promise<SeasonExams> {
  const key = `${year}_${semester}`
  if (cache.has(key)) return Promise.resolve(cache.get(key)!)
  if (pending.has(key)) return pending.get(key)!

  const promise = fetch(`/data/api/exams/${key}.json`)
    .then((res) => (res.ok ? res.json() : {}))
    .then((data: SeasonExams) => {
      cache.set(key, data)
      pending.delete(key)
      return data
    })
    .catch(() => {
      pending.delete(key)
      return {} as SeasonExams
    })

  pending.set(key, promise)
  return promise
}

export function useSeasonExams(year: string, semester: string) {
  const key = `${year}_${semester}`
  const [exams, setExams] = useState<SeasonExams>(() => cache.get(key) ?? {})
  const [isLoading, setIsLoading] = useState(!cache.has(key))

  useEffect(() => {
    if (cache.has(key)) {
      setExams(cache.get(key)!)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    fetchSeasonExams(year, semester).then((data) => {
      setExams(data)
      setIsLoading(false)
    })
  }, [key, year, semester])

  return { exams, isLoading }
}
