import React from "react"

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

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/**
 * Generates a React table structure representing a timetable based on provided timeslots and timetable data.
 *
 * @returns React.ReactNode - A nested array of React elements representing the table rows and cells.
 */
// const generateTable = (
//   courses: StarsTableCourse[],
//   numberOfDays: number
// ): React.ReactNode => {
//   const toReturn: React.ReactNode[][] = []

//   // Populates the array with timeslot and days
//   STARS_TIMESLOTS.forEach((timeslot) => {
//     // append each day the user wants to show
//     const daysArray = daysOfWeek
//       .slice(0, numberOfDays)
//       .map((_v) => <TableCell className="p-1" />)

//     return toReturn.push([
//       <TableCell className="p-1 text-center">
//         {timeslot.start} to <br className="md:hidden" /> {timeslot.end}
//       </TableCell>,
//       ...daysArray
//     ])
//   })

//   courses.forEach((course) => {
//     /**
//      *
//      */
//     // A index can have multiple ... TODO: do this

//     // const allIndexes = []
//     // Object.keys(course.indexes).forEach(key =>
//     //     allIndexes.push(course.indexes[key])

//     //   )

//     const mainIndex = course.selectedIndex[0]
//     const tsIndex = STARS_TIMESLOTS.findIndex(
//       (ts) => ts.start === mainIndex.time.split("-")[0]
//     )

//     for (let i = 0; i < mainIndex.duration; i++) {
//       if (i === 0) {
//         toReturn[tsIndex][mainIndex.day] = (
//           <StarsCell className="p-1" course={course} />
//         )
//       } else {
//         /**
//          * This will override table cell to create a null element, this is needed as adding another
//          * table cell will push columns out of the max days of the week.
//          */
//         toReturn[tsIndex + i][mainIndex.day] = <></>
//       }
//     }
//   })

//   return toReturn.map((x, i) => (
//     <TableRow key={i} className="border-slate-150 dark:border-slate-900">
//       {x.map((cell, j) => (
//         <React.Fragment key={j}>{cell}</React.Fragment>
//       ))}
//     </TableRow>
//   ))
// }

interface StarsTableCourse extends Course {
  selectedIndex: Index[]
}

interface StarsTableProps {
  courses: StarsTableCourse[]
  numberOfDays?: number // 7 means 7 days (mon-sun)
}

export default function StarsTable(props: StarsTableProps) {
  const { courses, numberOfDays = DEFAULT_DAYS_TO_SHOW } = props

  const generateTable = () => {
    STARS_TIMESLOTS.forEach((timeslot) => {
      // append each day the user wants to show
      const daysArray = daysOfWeek
        .slice(0, numberOfDays)
        .map((_v) => <TableCell className="p-1" />)

      // return toReturn.push([
      //   <TableCell className="p-1 text-center">
      //     {timeslot.start} to <br className="md:hidden" /> {timeslot.end}
      //   </TableCell>,
      //   ...daysArray
      // ])
    })

    return <div></div>
  }

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

      <TableBody>{generateTable()}</TableBody>
      {/* <TableBody>{generateTable(courses, numberOfDays)}</TableBody> */}
    </Table>
  )
}
