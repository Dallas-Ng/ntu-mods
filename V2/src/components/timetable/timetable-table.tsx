"use client"

import { Fragment } from "react"

import { STARS_TIMESLOTS, TRUN_DAY_MAP } from "@/lib/constants"
import { getModuleIndexMap } from "@/lib/get-module-index-map"
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
}

const TimetableTable = (props: Props) => {
  const { timetable } = useTimetable()
  const moduleIndexMap = getModuleIndexMap(timetable)

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
      <td className="relative p-1 text-center">
        {i !== 0 && (
          <span className="absolute left-0 top-[-8px] w-full bg-background">
            {STARS_TIMESLOTS[i].start}
          </span>
        )}

        <div className="min-h-[20px] w-full" />
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
          moduleKey={moduleKey}
          index={index}
          disableActions={props.disableActions}
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
    <th
      key={k}
      colSpan={v}
      className="h-fit p-0 text-center font-normal text-secondary">
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

    return (
      <tr key={matrixRowIdx}>
        {matrixRow.map((matrixCol, matrixColIdx) =>
          matrixCol ? (
            <Fragment key={matrixColIdx}>{matrixCol}</Fragment>
          ) : (
            <td className="p-0" key={matrixColIdx} />
          )
        )}
      </tr>
    )
  })

  return (
    <table className="table-border h-full w-full table-fixed border-collapse border p-0 text-[0.6rem] md:text-xs">
      <thead>
        <tr>
          <th className="w-[38px]"></th>

          {TableHeadItems}
        </tr>
      </thead>

      <tbody>{TableBodyItems}</tbody>
    </table>
  )
}

export const TimetableTableLoader = () => {
  return (
    <table className="table-border h-full w-full table-fixed border-collapse border p-0 text-[0.6rem] md:text-xs">
      <thead>
        <tr>
          <th className="w-[38px]"></th>
          <th className="h-fit p-0 text-center font-normal text-secondary">
            Mon
          </th>
          <th className="h-fit p-0 text-center font-normal text-secondary">
            Tue
          </th>
          <th className="h-fit p-0 text-center font-normal text-secondary">
            Wed
          </th>
          <th className="h-fit p-0 text-center font-normal text-secondary">
            Thu
          </th>
          <th className="h-fit p-0 text-center font-normal text-secondary">
            Fri
          </th>
        </tr>
      </thead>

      <tbody>
        {STARS_TIMESLOTS.map((x, i) => (
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
