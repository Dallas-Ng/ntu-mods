"use client"

import { useBoundState } from "@/state/bound.state"

import {
  PUBLISHED_SEMESTERS,
  resolveSemester,
  semesterLabel,
  semesterLabelShort,
  splitSemester
} from "@/lib/semesters"
import { SEMESTER_PARAM, semesterFromParam } from "@/lib/timetable-share"
import { useSearchParams } from "@/hooks/use-search-params"

/**
 * The semester the planner is showing. A `sem` link param wins (a shared or
 * screenshot link names its own semester, even one that is no longer
 * selectable), then the user's saved choice, then the newest semester.
 */
export const useSelectedSemester = () => {
  const searchParams = useSearchParams()
  const stored = useBoundState((s) => s.semester)

  const fromUrl = semesterFromParam(searchParams.get(SEMESTER_PARAM))
  const urlSemester =
    fromUrl && PUBLISHED_SEMESTERS.includes(fromUrl) ? fromUrl : undefined

  const key = urlSemester ?? resolveSemester(stored)
  const [year, semester] = splitSemester(key)

  return {
    key,
    year,
    semester,
    label: semesterLabel(key),
    labelShort: semesterLabelShort(key),
    /** True when a link, not the user's own choice, picked the semester. */
    isFromUrl: urlSemester !== undefined
  }
}
