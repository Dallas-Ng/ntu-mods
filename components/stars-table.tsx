import React from "react"

import {
  STARS_CALENDAR_TIMESLOTS,
  STARS_FAKE_DATA
} from "@/config/stars-config"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import StarsCell from "@/components/stars-cell"

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/**
 * Generates a React table structure representing a timetable based on provided timeslots and timetable data.
 *
 * @returns React.ReactNode - A nested array of React elements representing the table rows and cells.
 */
const generateTable = (numberOfDays: number): React.ReactNode => {
  const toReturn: React.ReactNode[][] = []

  // Populates the array with timeslot and days
  STARS_CALENDAR_TIMESLOTS.forEach((timeslot) => {
    // append each day the user wants to show
    const daysArray = daysOfWeek
      .slice(0, numberOfDays)
      .map((_v) => <TableCell className="p-1" />)

    return toReturn.push([
      <TableCell className="p-1 text-center">
        {timeslot.start} to <br className="md:hidden" /> {timeslot.end}
      </TableCell>,
      ...daysArray
    ])
  })

  STARS_FAKE_DATA.forEach((data) => {
    const tsIndex = STARS_CALENDAR_TIMESLOTS.findIndex(
      (ts) => ts.start === data.start
    )

    for (let i = 0; i < data.rowSpan; i++) {
      if (i === 0) {
        toReturn[tsIndex][data.day] = (
          <StarsCell className="p-1" course={data} />
        )
      } else {
        /**
         * This will override table cell to create a null element, this is needed as adding another
         * table cell will push columns out of the max days of the week.
         */
        toReturn[tsIndex + i][data.day] = <></>
      }
    }
  })

  return toReturn.map((x, i) => (
    <TableRow key={i} className="border-slate-150 dark:border-slate-900">
      {x.map((cell, j) => (
        <React.Fragment key={j}>{cell}</React.Fragment>
      ))}
    </TableRow>
  ))
}

interface StarsTableProps {
  numberOfDays?: number // 7 means 7 days (mon-sun)
}

export default function StarsTable(props: StarsTableProps) {
  const { numberOfDays = 6 } = props

  return (
    <Table className="table-fixed border-collapse text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="text-center md:w-[95px]">Time</TableHead>

          {daysOfWeek.slice(0, numberOfDays).map((v) => (
            <TableHead key={v} className="text-center">
              {v}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>{generateTable(numberOfDays)}</TableBody>
    </Table>
  )
}
