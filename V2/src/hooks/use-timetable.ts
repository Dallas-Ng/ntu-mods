"use client"

import { useBoundState } from "@/state/bound.state"

import { useQsTimetable } from "./use-qs-timetable"

export function useTimetable(argTimetable?: Timetable) {
  const {
    timetables,
    timetableIndex,
    addItemToTimetable,
    removeItemFromTimetable,
    updateTimetableIndex
  } = useBoundState()

  const qsTimetable = useQsTimetable()

  const stateTimetable = timetables[timetableIndex]

  const timetable = argTimetable ?? qsTimetable ?? stateTimetable

  return {
    timetable,
    timetables,
    timetableIndex,
    argTimetable,
    stateTimetable,
    qsTimetable,
    addItemToTimetable,
    removeItemFromTimetable,
    updateTimetableIndex
  }
}
