"use client"

import React from "react"
import { useBoundState } from "@/state/bound-state"

import { DAY_TRUN_MAP, STARS_TIMESLOTS } from "@/config/stars"
import { useQueryStringCTI } from "@/hooks/use-qs-CTI"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

import StarsCell from "./stars-cell"

/**
 * Calculates the number of conflicts between a given time slot and previous time slots in a day.
 *
 * @param dayMapVal - An array of time slots representing the schedule for a day.
 * @param currentIndex - The index of the current time slot being checked for conflicts.
 * @param currentDayIndex - The index of the current day being checked for conflicts. Defaults to 0.
 * @returns The number of conflicts between the current time slot and previous time slots.
 */
const getConflicts = (
  dayMapVal: Index[],
  currentIndex: Index,
  currentDayIndex = 0 // this is used to track how many times to count a unique conflict
) => {
  let conflictsCount = 0

  for (let i = 0; i < currentDayIndex; i++) {
    if (dayMapVal[i].key === currentIndex.key) {
      continue
    }

    const previousSlot = dayMapVal[i]
    const [currentStart, currentEnd] = currentIndex.time.split("-").map(Number)
    const [previousStart, previousEnd] = previousSlot.time
      .split("-")
      .map(Number)

    // If there is an overlap, increment conflictsCount
    if (currentStart < previousEnd && currentEnd > previousStart) {
      conflictsCount++
    }
  }
  return conflictsCount
}

interface StarsTableProps {
  coursesToIndex?: { [courseKey: string]: Index[] }
  disablePopup?: boolean
  disableSelect?: boolean
  fullCell?: boolean
}

export default function StarsTable(props: StarsTableProps) {
  const coursesToIndexFromQueryString = useQueryStringCTI()
  const coursesToIndexFromState = useBoundState().coursesToIndex

  /**
   * Pirority of coursesToIndex:
   *    1. props.coursesToIndex
   *    2. coursesToIndexFromQueryString
   *    3. coursesToIndexFromState
   */
  let coursesToIndex = props.coursesToIndex
    ? props.coursesToIndex
    : Object.keys(coursesToIndexFromQueryString).length > 0
      ? coursesToIndexFromQueryString
      : coursesToIndexFromState

  const MAP: { [day: number]: Index[] } = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
  }

  const MAP_CONFLICTS: { [day: number]: number } = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  }

  // Automatically show weekend days if there are any
  const hasSaturday = Object.values(coursesToIndex).some((entries) =>
    entries.find((x) => x.day === 6)
  )

  const hasSunday = Object.values(coursesToIndex).some((entries) =>
    entries.find((x) => x.day === 7)
  )

  // Append weekend days to MAP & Conficts
  if (hasSunday) {
    MAP[6] = []
    MAP[7] = []
    MAP_CONFLICTS[6] = 0
    MAP_CONFLICTS[7] = 0
  } else if (hasSaturday) {
    MAP[6] = []
    MAP_CONFLICTS[6] = 0
  }

  // Push each day data into MAP
  Object.values(coursesToIndex).forEach((entries) => {
    entries.forEach((entry) => {
      MAP[entry.day].push(entry)
    })
  })

  /**
   * Calculates the conflicts for each day in the MAP object.
   * Updates the MAP_CONFLICTS object with the maximum conflicts for each day.
   */
  Object.entries(MAP).forEach(([dayMapKey, dayMapVal]) => {
    MAP_CONFLICTS[dayMapKey as unknown as 1 | 2 | 3 | 4 | 5] =
      dayMapVal.reduce(
        (max, index, i) => Math.max(max, getConflicts(dayMapVal, index, i + 1)),
        0
      ) + 1 // count unique conflicts, + 1 for positioning purposes
  })

  /**
   * Calculates the MAX timeslots all indexes in the MAP object.
   */
  let TIMETABLE_MAX = 800
  Object.entries(MAP).forEach(([_, dayMapVal]) => {
    const maxTime = Math.max(
      ...dayMapVal.map((index) => parseInt(index.time.split("-")[1]))
    )

    if (TIMETABLE_MAX < maxTime) TIMETABLE_MAX = maxTime
  })

  const maxTimeSlotToShow = STARS_TIMESLOTS.findIndex(
    (x) => TIMETABLE_MAX <= x.end
  )
  const ROWS_TO_SHOW =
    STARS_TIMESLOTS.length - (STARS_TIMESLOTS.length - maxTimeSlotToShow - 1) // 1 is equivalent of having 0 buffer row

  // Minimum number of rows to show is 22 - 1930
  const MATRIX_ROWS = ROWS_TO_SHOW < 22 ? 22 : ROWS_TO_SHOW

  const MATRIX_COLUMNS = Object.values(MAP_CONFLICTS).reduce(
    (acc, v) => acc + v
  )

  // Create Matrix
  const STARS_MATRIX = Array.from({ length: MATRIX_ROWS }, (_, i) => {
    const timeslot = (
      <TableCell className="w-[50px] p-1 text-center md:w-[95px]">
        {STARS_TIMESLOTS[i].start} to {STARS_TIMESLOTS[i].end}
      </TableCell>
    )

    return [timeslot, ...Array(MATRIX_COLUMNS).fill(null)]
  })

  /**
   * Iterates through the MAP object and populates the STARS_MATRIX with table cells based on the data.
   *
   * The table cells are positioned in the matrix based on the relative position of the index inside the MAP.
   * If conflicts exist, the table cells are adjusted accordingly.
   */
  Object.entries(MAP).forEach(([dayMapKey, dayMapVal]) => {
    let currentDayIndex = 0 // this index is used to iterate over the number of available column for each day

    // Iterating through each index
    dayMapVal.forEach((index) => {
      const tsIndex = STARS_TIMESLOTS.findIndex(
        (st) => st.start === parseInt(index.time.split("-")[0])
      )

      // Get relative position of this index inside the matrix
      const offsetValue =
        Object.entries(MAP_CONFLICTS)
          .filter(([dmK]) => dmK < dayMapKey)
          .map(([, v]) => v)
          .reduce((sum, count) => sum + count, 0) + 1 // default is 1 as 0 is timeslot

      const conflictsCount = getConflicts(dayMapVal, index, currentDayIndex)
      const cellPosition = offsetValue + conflictsCount

      currentDayIndex++

      const courseKey = Object.keys(coursesToIndex).find((x) =>
        coursesToIndex[x].find((y) => y.key === index.key)
      )

      STARS_MATRIX[tsIndex][cellPosition] = (
        <StarsCell
          fullCell={props.fullCell}
          disablePopup={props.disablePopup}
          disableSelect={props.disableSelect}
          courseKey={courseKey || ""}
          index={index}
          coursesToIndex={coursesToIndex}
        />
      )

      for (let i = 1; i < index.duration; i++) {
        STARS_MATRIX[tsIndex + i][cellPosition] = <></>
      }
    })
  })

  /**
   * Generation of Table Head and Table Body
   */
  const TableHeadItems = Object.entries(MAP_CONFLICTS).map(([k, v]) => (
    <TableHead key={k} colSpan={v} className="h-fit p-0 text-center">
      {DAY_TRUN_MAP[Number(k)]}
    </TableHead>
  ))

  const TableBodyItems = STARS_MATRIX.map((matrixRow, matrixRowIdx) => (
    <TableRow key={matrixRowIdx}>
      {matrixRow.map((matrixCol, matrixColIdx) =>
        matrixCol ? (
          <React.Fragment key={matrixColIdx}>{matrixCol}</React.Fragment>
        ) : (
          <TableCell className="p-0" key={matrixColIdx} />
        )
      )}
    </TableRow>
  ))

  return (
    <Table className="h-full table-fixed border-collapse border p-0 text-[0.6rem] md:text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="h-fit w-[50px] p-1 text-center md:w-[95px]">
            Time
          </TableHead>

          {TableHeadItems}
        </TableRow>
      </TableHeader>

      <TableBody>{TableBodyItems}</TableBody>
    </Table>
  )
}
