"use client"

import { useBoundState } from "@/state/bound.state"

import { useQsTimetable } from "./use-qs-timetable"

export const useTimetable = (argTimetable?: Timetable) => {
  const {
    timetables,
    timetableIndex,
    updateTimetable,
    addItemToTimetable,
    removeItemFromTimetable,
    updateItemIndex,
    updateTimetableIndex,
    migrateTimetable,
    duplicateTimetable
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
    updateItemIndex,
    updateTimetable,
    updateTimetableIndex,
    migrateTimetable,
    duplicateTimetable
  }
}
