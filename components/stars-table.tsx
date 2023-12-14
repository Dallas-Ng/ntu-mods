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

interface StarsTableProps {}

export default function StarsTable(_props: StarsTableProps) {
  const { courses, coursesToIndex } = useBoundState()

  /**
   * DAY_MAP is a mapping object used for calendar operations.
   * Each key represents a day unit (mon - 1, tue - 2)
   *
   * @typedef {Object} DayMapping
   * @property {string} label - Human-readable string representing the day
   * @property {number} index - Index used to generate columns for each day
   * @property {number} freq - Number of columns a day has
   */
  const DAY_MAP: {
    [key: number]: { label: string; index: number; freq: number }
  } = {
    1: { label: "Mon", index: 0, freq: 0 },
    2: { label: "Tue", index: 0, freq: 0 },
    3: { label: "Wed", index: 0, freq: 0 },
    4: { label: "Thu", index: 0, freq: 0 },
    5: { label: "Fri", index: 0, freq: 0 },
    6: { label: "Sat", index: 0, freq: 0 },
    7: { label: "Sun", index: 0, freq: 0 }
  }

  // Remove days that are not selected to be shown in the timetable
  for (let i = 7; i > DEFAULT_DAYS_TO_SHOW; i--) {
    delete DAY_MAP[i]
  }

  // Update the frequency of days in DAY_MAP based on the course indexes
  courses.forEach((course) => {
    const mainIndexKey = coursesToIndex[course.key]

    course.indexes[mainIndexKey].forEach((index) => {
      DAY_MAP[index.day].freq++
    })
  })

  /**
   * Calculates the cell index for a given day map key in a timetable.
   *
   * @param {number} dayMapKey - The key representing a day unit.
   * @returns {number} - The calculated cell index.
   */
  const getCellIndex = (dayMapKey: number): number => {
    let cellIndex = 1 // The timeslot is the first index

    // Iterate over the entries in DAY_MAP
    Object.entries(DAY_MAP).forEach(([k, v]) => {
      if (Number(k) < dayMapKey) {
        // Increment cell index based on the frequency of the previous day
        cellIndex += v.freq || 1 // 0 should still increment by 1
      }

      if (Number(k) === dayMapKey) {
        // Add the index for the current day
        cellIndex += v.index
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

  const generateTableBody = () => {
    const toReturn: React.ReactNode[][] = []

    // Generates table cells for each day based on frequency
    // Frequency represents the number of indexes with the same day and time slot
    const TableBodyEmptyCells = () => {
      const cells: React.ReactNode[] = []

      Object.entries(DAY_MAP).map(([k, v]) => {
        const freq = v.freq === 0 ? 1 : v.freq

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

    // Build a matrix, it is a representation of the table shown in the UI
    // [timeslot] [monday cells] [tuesday cells] [...]
    STARS_TIMESLOTS.forEach((timeslot) => {
      return toReturn.push([
        <TableCell className="p-1 text-center" key={timeslot.start}>
          {timeslot.start} to <br className="md:hidden" /> {timeslot.end}
        </TableCell>,
        ...TableBodyEmptyCells()
      ])
    })

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
        const dayMapItem = DAY_MAP[dayMapKey]

        const tsIndex = STARS_TIMESLOTS.findIndex(
          (ts) => ts.start === index.time.split("-")[0]
        )

        // bnasically for each time, we want to find the cell pos
        const cellIndex = getCellIndex(dayMapKey)
        console.log(index.day, cellIndex, dayMapItem.index)

        toReturn[tsIndex][cellIndex] = (
          <StarsCell className="p-1" course={course} index={index} />
        )
        // If there is multiple frequencies of the same timeslot and day, increment the index by 1
        if (dayMapItem.freq > 1) {
          dayMapItem.index++
        }

        for (let i = 1; i < index.duration; i++) {
          toReturn[tsIndex + i][cellIndex] = <></>
        }
      })
    })

    return toReturn.map((x, i) => (
      <TableRow key={i} className="border-slate-150 dark:border-slate-900">
        {x.map((cell, j) => (
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
