import React from "react"
import { useBoundState } from "@/state/bound-state"

import { DEFAULT_DAYS_TO_SHOW, STARS_TIMESLOTS } from "@/config/stars"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import StarsCell from "@/components/stars-cell"

function assignPositionToTimeslots(d: Timeslot[]) {
  for (let i = 0; i < d.length; i++) {
    let dayPosition = 0

    for (let j = 0; j < i; j++) {
      // Check if the start time of the current time slot (i-th) is within the time range of another time slot (j-th)
      const conflict1 = d[i].start >= d[j].start && d[i].start <= d[j].end
      // Check if the end time of the current time slot (i-th) is within the time range of another time slot (j-th)
      const conflict2 = d[i].end >= d[j].start && d[i].end <= d[j].end

      if (conflict1 || conflict2) dayPosition++
    }

    d[i].dayPosition = dayPosition
  }

  return d
}

interface Timeslot {
  indexKey: string
  start: number
  end: number
  dayPosition: number
  position: number
}

interface StarsTableProps {}

export default function StarsTable(_props: StarsTableProps) {
  const { courses, coursesToIndex } = useBoundState()

  /**
   * DAY_MAP is a mapping object used for calendar operations.
   * Each key represents a day unit (mon - 1, tue - 2)
   *
   * @typedef {Object} DayMapping
   * @property {string} label - Human-readable string representing the day
   * @property {number} freq - Number of freq a day has
   */
  const DAY_MAP: {
    [key: number]: {
      label: string
      freq: number
      timeslots: Timeslot[]
    }
  } = {
    1: { label: "Mon", freq: 0, timeslots: [] },
    2: { label: "Tue", freq: 0, timeslots: [] },
    3: { label: "Wed", freq: 0, timeslots: [] },
    4: { label: "Thu", freq: 0, timeslots: [] },
    5: { label: "Fri", freq: 0, timeslots: [] },
    6: { label: "Sat", freq: 0, timeslots: [] },
    7: { label: "Sun", freq: 0, timeslots: [] }
  }

  // Remove days that are not selected to be shown in the timetable
  for (let i = 7; i > DEFAULT_DAYS_TO_SHOW; i--) {
    delete DAY_MAP[i]
  }

  // Create timeslot objects from indexes for each day
  courses.forEach((course) => {
    const mainIndexKey = coursesToIndex[course.key]

    course.indexes[mainIndexKey].forEach((index) => {
      const [start, end] = index.time.split("-")

      const obj = {
        indexKey: index.key,
        start: parseInt(start),
        end: parseInt(end),
        dayPosition: 0,
        position: 0
      }

      DAY_MAP[index.day].timeslots.push(obj)
    })
  })

  // Update generate freq and timeslot data
  Object.entries(DAY_MAP).forEach(([k, v]) => {
    const item = DAY_MAP[Number(k)]
    const timeslots = item.timeslots

    item.timeslots = assignPositionToTimeslots(timeslots)
    item.freq = Math.max(
      ...DAY_MAP[Number(k)].timeslots.map((x) => x.dayPosition + 1)
    )
  })

  /**
   * Calculates the cell position for a given day map key and index key in a timetable.
   *
   * @param {number} dayMapKey - The key representing a day unit.
   * @param {string} indexKey - The key representing an index in the timetable.
   * @returns {number} - The calculated cell position.
   */
  const getCellPosition = (dayMapKey: number, indexKey: string): number => {
    let cellIndex = 1 // The timeslot is the first index

    Object.entries(DAY_MAP).forEach(([k, v]) => {
      // Increment cell index based on the frequency of the days before this dayMapKey
      if (Number(k) < dayMapKey) {
        cellIndex += v.freq || 1 // 0 should still increment by 1
      }

      if (Number(k) === dayMapKey) {
        const ts = DAY_MAP[dayMapKey].timeslots.find(
          (x) => x.indexKey === indexKey
        )

        // If the timeslot is found, add its dayPosition to the cellIndex
        if (ts) cellIndex += ts.dayPosition
      }
    })

    return cellIndex
  }

  // Create table header items based on the DAY_MAP entries
  const TableHeadItems = Object.entries(DAY_MAP).map(([k, v]) => (
    <TableHead key={k} colSpan={v.freq || 1} className="text-center">
      {v.label}
    </TableHead>
  ))

  /**
   * Generates a timetable table body based on the provided courses and DAY_MAP configuration.
   *
   * @returns {React.JSX.Element[]} - A matrix representing the table shown in the UI.
   */
  const generateTableBody = (): React.JSX.Element[] => {
    const toReturn: React.ReactNode[][] = []

    // Generate empty cells for each day based on frequency
    const emptyCellsForRow = () => {
      const cells: React.ReactNode[] = []

      Object.entries(DAY_MAP).map(([k, v]) => {
        const freq = v.freq || 1

        for (let i = 0; i < freq; i++) {
          cells.push(
            <TableCell key={i}>
              {/* <span>
                {DAY_MAP[Number(k)].label[0]}-{i}
              </span> */}
            </TableCell>
          )
        }
      })
      return cells
    }

    // Iterate over each timeslot and generate rows with empty cells
    STARS_TIMESLOTS.forEach((timeslot) =>
      toReturn.push([
        <TableCell className="p-1 text-center" key={timeslot.start}>
          {timeslot.start} to <br className="md:hidden" /> {timeslot.end}
        </TableCell>,
        ...emptyCellsForRow()
      ])
    )

    // Creating star cells
    courses.forEach((course) => {
      const selectedIndex = coursesToIndex[course.key]
      const indexData = course.indexes[selectedIndex]

      // TODO: DEBUG THIS
      if (!indexData) {
        console.error(`course, selectedIndex`)
        console.error(course, selectedIndex)
        return
      }

      indexData.forEach((index) => {
        const dayMapKey = index.day as keyof typeof DAY_MAP
        const tsIndex = STARS_TIMESLOTS.findIndex(
          (ts) => ts.start === index.time.split("-")[0]
        )

        const cellIndex = getCellPosition(dayMapKey, index.key)

        toReturn[tsIndex][cellIndex] = (
          <StarsCell
            className="p-1"
            course={course}
            index={index}
            hasConflict={false}
          />
        )

        // Remove cells below the original StarCell (due to rowSpan)
        for (let i = 1; i < index.duration; i++) {
          toReturn[tsIndex + i][cellIndex] = <></>
        }
      })
    })

    return toReturn.map((row, i) => (
      <TableRow key={i} className="border-slate-150 dark:border-slate-900">
        {row.map((cell, j) => (
          <React.Fragment key={j}>{cell}</React.Fragment>
        ))}
      </TableRow>
    ))
  }

  return (
    <Table className="table-fixed border-collapse text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="text-center md:w-[95px]">Time</TableHead>

          {TableHeadItems}
        </TableRow>
      </TableHeader>

      <TableBody>{generateTableBody()}</TableBody>
    </Table>
  )
}
