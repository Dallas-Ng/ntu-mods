"use client"

import SEMESTERS_JSON from "@/data/api/semesters.json"

const FALLBACK_CODE =
  (SEMESTERS_JSON as Array<{ code: string }>)[0]?.code ?? "2025;2"
const [FALLBACK_YEAR, FALLBACK_SEMESTER] = FALLBACK_CODE.split(";")

export function useLatestSemester() {
  return { year: FALLBACK_YEAR, semester: FALLBACK_SEMESTER, isLoading: false }
}
