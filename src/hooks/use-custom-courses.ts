"use client"

import { useBoundState } from "@/state/bound.state"

import { useQsCustomCourses } from "./use-qs-timetable"

/**
 * Custom blocks for whatever timetable is on screen: the ones baked into a
 * share link when viewing someone else's, otherwise the current plan's.
 */
export const useCustomCourses = () => {
  const customCourses = useBoundState((s) => s.customCourses)
  const timetableIndex = useBoundState((s) => s.timetableIndex)
  const qsCustomCourses = useQsCustomCourses()

  const stateCustomCourses = customCourses[timetableIndex] ?? []

  return {
    customCourses: qsCustomCourses ?? stateCustomCourses,
    stateCustomCourses,
    qsCustomCourses,
    isReadOnly: qsCustomCourses !== undefined
  }
}
