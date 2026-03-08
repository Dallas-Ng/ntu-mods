"use client"

import { useEffect, useState } from "react"
import SEMESTERS_JSON from "@/data/api/semesters.json"

interface LatestSemesterState {
  year: string
  semester: string
  isLoading: boolean
}

let cached: { year: string; semester: string } | null = null
let fetchPromise: Promise<{ year: string; semester: string }> | null = null

const FALLBACK_CODE = (
  (SEMESTERS_JSON as Array<{ code: string }>)[0]?.code ?? "2025;2"
)
const [FALLBACK_YEAR, FALLBACK_SEMESTER] = FALLBACK_CODE.split(";")

async function fetchLatestSemester(): Promise<{ year: string; semester: string }> {
  if (!fetchPromise) {
    fetchPromise = fetch("/api/data/semesters")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch semesters")
        return res.json()
      })
      .then((data: { latestSemester?: string }) => {
        const raw = data.latestSemester
        if (!raw || !raw.includes(";")) {
          throw new Error("Invalid latestSemester response")
        }
        const [year, semester] = raw.split(";")
        cached = { year, semester }
        return cached
      })
      .catch(() => ({ year: FALLBACK_YEAR, semester: FALLBACK_SEMESTER }))
  }

  return fetchPromise
}

export function useLatestSemester(): LatestSemesterState {
  const [state, setState] = useState<LatestSemesterState>(() => {
    if (cached) {
      return { year: cached.year, semester: cached.semester, isLoading: false }
    }
    return {
      year: FALLBACK_YEAR,
      semester: FALLBACK_SEMESTER,
      isLoading: true
    }
  })

  useEffect(() => {
    if (cached) {
      setState({ year: cached.year, semester: cached.semester, isLoading: false })
      return
    }

    fetchLatestSemester().then(({ year, semester }) => {
      setState({ year, semester, isLoading: false })
    })
  }, [])

  return state
}
