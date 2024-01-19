"use client"

import { Fragment, useState } from "react"

import { STARS_TIMESLOTS, TRUN_DAY_MAP } from "@/lib/constants"
import { getModuleIndexMap } from "@/lib/get-module-index-map"
import { cn } from "@/lib/utils"
import { useTimetable } from "@/hooks/use-timetable"

import TimetableCell from "./timetable-cell"

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
  disableActions?: boolean
  fullCell?: boolean
  timetable?: Timetable
}

const TimetableTable = (props: Props) => {
  const { timetable } = useTimetable(props.timetable)
  const moduleIndexMap = getModuleIndexMap(timetable)
  const [currentHoverKey, setCurrentHoverKey] = useState("")

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
  const hasSaturday = Object.values(moduleIndexMap).some((entries) =>
    entries.find((x) => x.day === 6)
  )

  const hasSunday = Object.values(moduleIndexMap).some((entries) =>
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
  Object.values(moduleIndexMap).forEach((entries) => {
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

      const moduleKey = Object.keys(moduleIndexMap).find((x) =>
        moduleIndexMap[x].find((y) => y.key === index.key)
      ) as string // Guaranteed to be defined

      STARS_MATRIX[tsIndex][cellPosition] = (
        <TimetableCell
          onMouseOver={() => setCurrentHoverKey(moduleKey)}
          onMouseOut={() => setCurrentHoverKey("")}
          dimmed={
            currentHoverKey !== "" ? currentHoverKey !== moduleKey : undefined
          }
          indexes={moduleIndexMap[moduleKey]}
          moduleKey={moduleKey}
          index={index}
          fullCell={props.fullCell}
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
    <th key={k} colSpan={v} className="">
      {TRUN_DAY_MAP[Number(k)]}
    </th>
  ))

  const TableBodyItems = STARS_MATRIX.map((matrixRow, matrixRowIdx) => {
    // Hide rows that are not within the time range
    if (Object.keys(moduleIndexMap).length > 0) {
      if (
        matrixRowIdx < minTimeSlotToShow ||
        matrixRowIdx > maxTimeSlotToShow
      ) {
        return null
      }
    }

    // Default appearance of table
    if (Object.keys(moduleIndexMap).length === 0) {
      // 0930 to 1800
      if (matrixRowIdx < 3 || matrixRowIdx > 20) {
        return null
      }
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

export const TimetableTableLoader = () => (
  <table className="table-fixed text-[0.6rem] md:text-xs">
    <thead>
      <tr>
        <th className="w-[28px] md:w-[40px]"></th>
        <th>Mon</th>
        <th>Tue</th>
        <th>Wed</th>
        <th>Thu</th>
        <th>Fri</th>
      </tr>
    </thead>

    <tbody>
      {STARS_TIMESLOTS.slice(3, 21).map((x, i) => (
        <tr key={i}>
          <td className="relative w-full max-w-[28px] md:max-w-[40px]">
            <span className="absolute left-0 top-[-8px] w-full bg-card text-center">
              {x.start}
            </span>

            <div className="min-h-[20px] w-[28px] md:w-[40px]" />
          </td>

          {Array.from({ length: 5 }, (_, i) => (
            <td key={i} />
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)

export default TimetableTable
