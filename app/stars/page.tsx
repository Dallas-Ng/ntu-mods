import { NextPage } from "next"

import {
  STARS_CALENDAR_TIMESLOTS,
  STARS_FAKE_DATA
} from "@/config/stars-config"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

const TABLE_DATA_PADDING_SIZE = "p-1"
const tdps = TABLE_DATA_PADDING_SIZE

const getModuleColor = (moduleCode: string): string => {
  if (moduleCode.includes("PH")) {
    return `yellow-500`
  } else if (moduleCode.includes("SC")) {
    return `emerald-500`
  } else if (moduleCode.includes("MH")) {
    return `blue-500`
  } else if (moduleCode.includes("CC")) {
    return `red-500`
  }

  return `gray-500`
}

/**
 * Generates a React table structure representing a timetable based on provided timeslots and timetable data.
 *
 * @returns React.ReactNode - A nested array of React elements representing the table rows and cells.
 */
const generateTable = (): React.ReactNode => {
  const toReturn: React.ReactNode[][] = []

  // Populates the array with timeslot and day 1-6 (mon-sat)
  STARS_CALENDAR_TIMESLOTS.forEach((timeslot) =>
    toReturn.push([
      <TableCell className={`${tdps}`}>
        {timeslot.start} to {timeslot.end}
      </TableCell>,
      <TableCell className={cn(tdps)}></TableCell>, // monday
      <TableCell className={cn(tdps)}></TableCell>,
      <TableCell className={cn(tdps)}></TableCell>,
      <TableCell className={cn(tdps)}></TableCell>,
      <TableCell className={cn(tdps)}></TableCell>,
      <TableCell className={cn(tdps)}></TableCell> // saturday
    ])
  )

  STARS_FAKE_DATA.forEach((data) => {
    const tsIndex = STARS_CALENDAR_TIMESLOTS.findIndex(
      (ts) => ts.start === data.start
    )

    for (let i = 0; i < data.rowSpan; i++) {
      if (i === 0) {
        toReturn[tsIndex][data.day] = (
          <TableCell
            key={i}
            rowSpan={data.rowSpan}
            className={cn(
              tdps,
              "border",
              `border-l-${getModuleColor(data.courseCode)}`,
              "border-l-4"
            )}>
            <p>
              <span
                className={cn(
                  "font-bold",
                  `text-${getModuleColor(data.courseCode)}`
                )}>
                {data.courseCode}{" "}
              </span>

              {data.location}
            </p>

            <p>{data.time}</p>
          </TableCell>
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

  return toReturn.map((x, i) => <TableRow key={i}>{x}</TableRow>)
}

const StarsPage: NextPage = () => (
  <Table className="table-fixed border-collapse text-xs">
    <TableHeader>
      <TableRow>
        <TableHead className="w-[120px]">Time Slot</TableHead>
        <TableHead>Mon</TableHead>
        <TableHead>Tue</TableHead>
        <TableHead>Wed</TableHead>
        <TableHead>Thu</TableHead>
        <TableHead>Fri</TableHead>
        <TableHead>Sat</TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>{generateTable()}</TableBody>
  </Table>
)

export default StarsPage
