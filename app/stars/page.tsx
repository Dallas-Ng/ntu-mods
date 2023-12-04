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

const tdps = "p-1" // TABLE_DATA_PADDING_SIZE

const modules = {
  cc: { borderLeft: "border-l-red-500", text: "text-red-600" },
  sc: { borderLeft: "border-l-emerald-500", text: "text-emerald-600" },
  ph: { borderLeft: "border-l-yellow-500", text: "text-yellow-600" },
  mh: { borderLeft: "border-l-blue-500", text: "text-blue-600" }
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
      <TableCell className={cn(tdps, "text-center")}>
        {timeslot.start} to <br className="md:hidden" /> {timeslot.end}
      </TableCell>,
      <TableCell className={cn(tdps)}></TableCell>, // monday
      <TableCell className={cn(tdps)}></TableCell>,
      <TableCell className={cn(tdps)}></TableCell>,
      <TableCell className={cn(tdps)}></TableCell>,
      <TableCell className={cn(tdps)}></TableCell>
      // <TableCell className={cn(tdps)}></TableCell> // saturday
    ])
  )

  STARS_FAKE_DATA.forEach((data) => {
    const tsIndex = STARS_CALENDAR_TIMESLOTS.findIndex(
      (ts) => ts.start === data.start
    )

    for (let i = 0; i < data.rowSpan; i++) {
      const coursePrefix = data.courseCode
        .slice(0, 2)
        .toLowerCase() as keyof typeof modules

      if (i === 0) {
        toReturn[tsIndex][data.day] = (
          <TableCell
            key={i}
            rowSpan={data.rowSpan}
            className={cn(
              tdps,
              "border border-l-4 break-words",
              modules[coursePrefix].borderLeft
            )}>
            <p>
              <span className={cn("font-bold", modules[coursePrefix].text)}>
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
  <div className="bg-white dark:bg-slate-950 md:rounded-2xl border p-1">
    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-indigo-900 bg-clip-text text-transparent pl-4 pt-3">
      Stars* Planner
    </h1>

    <Table className="table-fixed border-collapse text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="text-center md:w-[95px]">Time Slot</TableHead>
          <TableHead>Mon</TableHead>
          <TableHead>Tue</TableHead>
          <TableHead>Wed</TableHead>
          <TableHead>Thu</TableHead>
          <TableHead>Fri</TableHead>
          {/* <TableHead>Sat</TableHead> */}
        </TableRow>
      </TableHeader>

      <TableBody>{generateTable()}</TableBody>
    </Table>
  </div>
)

export default StarsPage
