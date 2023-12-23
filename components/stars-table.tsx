"use client"

import React from "react"
import { useBoundState } from "@/state/bound-state"

import { STARS_TIMESLOTS } from "@/config/stars"
import { DAY_MAPPING } from "@/lib/utils"
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

interface StarsTableProps {}

export default function StarsTable(_props: StarsTableProps) {
  const coursesToIndexFromQueryString = useQueryStringCTI()
  const coursesToIndexFromState = useBoundState().coursesToIndex

  let coursesToIndex =
    Object.keys(coursesToIndexFromQueryString).length > 0
      ? coursesToIndexFromQueryString
      : coursesToIndexFromState

  const DAY_MAP: CourseIndex = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
    // 6: [],
    // 7: []
  }

  const DAY_MAP_CONFLICTS = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
    // 6: 0,
    // 7: 0
  }

  // Push each day data into DAY_MAP
  Object.values(coursesToIndex).forEach((entries) => {
    entries.forEach((entry) => {
      DAY_MAP[entry.day].push(entry)
    })
  })

  /**
   * Calculates the conflicts for each day in the DAY_MAP object.
   * Updates the DAY_MAP_CONFLICTS object with the maximum conflicts for each day.
   */
  Object.entries(DAY_MAP).forEach(([dayMapKey, dayMapVal]) => {
    DAY_MAP_CONFLICTS[dayMapKey as unknown as 1 | 2 | 3 | 4 | 5] =
      dayMapVal.reduce(
        (max, index, i) => Math.max(max, getConflicts(dayMapVal, index, i + 1)),
        0
      ) + 1 // count unique conflicts, + 1 for positioning purposes
  })

  const MATRIX_ROWS = STARS_TIMESLOTS.length
  const MATRIX_COLUMNS = Object.values(DAY_MAP_CONFLICTS).reduce(
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
   * Iterates through the DAY_MAP object and populates the STARS_MATRIX with table cells based on the data.
   *
   * The table cells are positioned in the matrix based on the relative position of the index inside the DAY_MAP.
   * If conflicts exist, the table cells are adjusted accordingly.
   */
  Object.entries(DAY_MAP).forEach(([dayMapKey, dayMapVal]) => {
    let currentDayIndex = 0 // this index is used to iterate over the number of available column for each day

    // Iterating through each index
    dayMapVal.forEach((index) => {
      const tsIndex = STARS_TIMESLOTS.findIndex(
        (st) => st.start === parseInt(index.time.split("-")[0])
      )

      // Get relative position of this index inside the matrix
      const offsetValue =
        Object.entries(DAY_MAP_CONFLICTS)
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
  const TableHeadItems = Object.entries(DAY_MAP_CONFLICTS).map(([k, v]) => (
    <TableHead key={k} colSpan={v} className="p-0 text-center">
      {DAY_MAPPING[Number(k) as keyof typeof DAY_MAPPING].slice(0, 3)}
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
    <Table className="table-fixed border-slate-500 p-0 text-[0.6rem] md:text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px] p-1 text-center md:w-[95px]">
            Time
          </TableHead>

          {TableHeadItems}
        </TableRow>
      </TableHeader>

      <TableBody>{TableBodyItems}</TableBody>
    </Table>
  )
}
