"use client"

import { Fragment, useEffect, useState } from "react"

import { STARS_TIMESLOTS, TRUN_DAY_MAP } from "@/lib/constants"
import { getIndexType } from "@/lib/get-index-type"
import { getModuleIndexes } from "@/lib/get-module-indexes"
import { cn } from "@/lib/utils"

import TimetableCell from "../timetable/timetable-cell"

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

interface Props {
  moduleKey: string
}

const TimetableTable = ({ moduleKey }: Props) => {
  const moduleIndexes = getModuleIndexes(moduleKey)
  const [currentHoverKey, setCurrentHoverKey] = useState("")

  let MAP: { [day: number]: Index[] } = {
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
  const hasSaturday = Object.values(moduleIndexes).some((entries) =>
    entries.find((x) => x.day === 6)
  )

  const hasSunday = Object.values(moduleIndexes).some((entries) =>
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
  Object.values(moduleIndexes).forEach((entries) => {
    entries.forEach((entry) => {
      MAP[entry.day].push(entry)
    })
  })

  const removeDuplicates = (dayMap: {
    [day: number]: Index[]
  }): { [day: number]: Index[] } => {
    const uniqueEntries: Set<string> = new Set()

    for (const day in dayMap) {
      dayMap[day] = dayMap[day].filter((entry) => {
        const criteria = `${entry.type}-${entry.group}-${entry.day}-${entry.time}-${entry.venue}`
        if (!uniqueEntries.has(criteria)) {
          uniqueEntries.add(criteria)
          return true
        }
        return false
      })
    }

    return dayMap
  }
  MAP = removeDuplicates(MAP)

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
  let TIMETABLE_MAX = 0
  let TIMETABLE_MIN = 2359

  Object.entries(MAP).forEach(([_, dayMapVal]) => {
    const maxTime = Math.max(
      ...dayMapVal.map((index) => parseInt(index.time.split("-")[1]))
    )
    if (TIMETABLE_MAX < maxTime) TIMETABLE_MAX = maxTime

    const minTime = Math.min(
      ...dayMapVal.map((index) => parseInt(index.time.split("-")[0]))
    )

    if (TIMETABLE_MIN > minTime) TIMETABLE_MIN = minTime
  })

  const maxTimeSlotToShow = STARS_TIMESLOTS.findIndex(
    (x) => TIMETABLE_MAX <= x.end
  )
  const minTimeSlotToShow = STARS_TIMESLOTS.findIndex(
    (x) => TIMETABLE_MIN <= x.start
  )

  // TODO: fix this so that it sohwos some sort of rows when empty cell

  const MATRIX_ROWS = STARS_TIMESLOTS.length

  const MATRIX_COLUMNS = Object.values(MAP_CONFLICTS).reduce(
    (acc, v) => acc + v
  )

  const STARS_MATRIX = Array.from({ length: MATRIX_ROWS }, (_, i) => {
    const timeslot = (
      <td className="relative w-full max-w-[28px] md:max-w-[40px]">
        {i !== 0 && (
          <span className="absolute left-0 top-[-8px] w-full bg-card text-center">
            {STARS_TIMESLOTS[i].start}
          </span>
        )}

        <div className="min-h-[20px] w-[28px] md:w-[40px]" />
      </td>
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

      STARS_MATRIX[tsIndex][cellPosition] = (
        <TimetableCell
          onMouseOver={() => setCurrentHoverKey(index.key)}
          onMouseOut={() => setCurrentHoverKey("")}
          dimmed={
            currentHoverKey !== ""
              ? currentHoverKey !== index.key &&
                getIndexType(index.type) !== "LEC"
              : undefined
          }
          moduleKey={moduleKey}
          index={index}
          fullCell
          hideTimeDate
          overrideIndex={getIndexType(index.type) === "LEC" ? <></> : null}
          divClassName={cn(STARS_MATRIX[tsIndex].length > 10 && "md:px-1")} // if there are more than 10 columns, reduce the padding
        />
      )

      for (let i = 1; i < index.duration; i++) {
        STARS_MATRIX[tsIndex + i][cellPosition] = <></>
      }
    })
  })

  /**
   * Calculates the max length of any day in matrix
   */
  let MAX_LENGTH_MATRIX = 0
  STARS_MATRIX.forEach((matrixRow) => {
    MAX_LENGTH_MATRIX = Math.max(matrixRow.length, MAX_LENGTH_MATRIX)
  })

  /**
   * Generation of Table Head and Table Body
   */
  const TableHeadItems = Object.entries(MAP_CONFLICTS).map(([k, v]) => (
    <th key={k} colSpan={v}>
      {TRUN_DAY_MAP[Number(k)]}
    </th>
  ))

  const TableBodyItems = STARS_MATRIX.map((matrixRow, matrixRowIdx) => {
    // Hide rows that are not within the time range
    if (matrixRowIdx < minTimeSlotToShow || matrixRowIdx > maxTimeSlotToShow) {
      return null
    }

    return (
      <tr key={matrixRowIdx}>
        {matrixRow.map((matrixCol, matrixColIdx) =>
          matrixCol ? (
            <Fragment key={matrixColIdx}>{matrixCol}</Fragment>
          ) : (
            <td key={matrixColIdx} />
          )
        )}
      </tr>
    )
  })

  // This means theres no indexes available for this module
  if (Object.keys(moduleIndexes).length === 0) {
    return (
      <div className="w-full border-2 p-4 text-center">
        No Indexes Available
      </div>
    )
  }

  // This means theres onyl online course
  if (Object.values(moduleIndexes).some((x) => x.length === 0)) {
    return (
      <div className="w-full border-2 p-4 text-center">
        No Indexes Available - Onine Course
      </div>
    )
  }

  const TABLE_OVERFLOW_THRESHOLD = MAX_LENGTH_MATRIX > 9
  return (
    <div className={cn(TABLE_OVERFLOW_THRESHOLD && "overflow-x-auto")}>
      <table
        className={cn(
          "w-full text-[0.6rem] md:text-xs",
          TABLE_OVERFLOW_THRESHOLD ? "table-auto" : "table-fixed"
        )}>
        <thead>
          <tr>
            <th className="w-[28px] md:w-[40px]"></th>

            {TableHeadItems}
          </tr>
        </thead>

        <tbody>{TableBodyItems}</tbody>
      </table>
    </div>
  )
}

export const TimetableTableLoader = () => {
  return (
    <table className="table-border size-full table-fixed border-collapse border p-0 text-[0.6rem] md:text-xs">
      <thead>
        <tr>
          <th className="w-[40px]"></th>
          <th className="h-fit p-0 text-center font-normal text-muted-foreground">
            Mon
          </th>
          <th className="h-fit p-0 text-center font-normal text-muted-foreground">
            Tue
          </th>
          <th className="h-fit p-0 text-center font-normal text-muted-foreground">
            Wed
          </th>
          <th className="h-fit p-0 text-center font-normal text-muted-foreground">
            Thu
          </th>
          <th className="h-fit p-0 text-center font-normal text-muted-foreground">
            Fri
          </th>
        </tr>
      </thead>

      <tbody>
        {STARS_TIMESLOTS.slice(0, 10).map((x, i) => (
          <tr key={i}>
            <td className="relative p-1 text-center">
              {i !== 0 && (
                <span className="absolute left-0 top-[-8px] w-full bg-background">
                  {x.start}
                </span>
              )}

              <div className="min-h-[20px] w-full" />
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TimetableTable
