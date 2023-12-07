/**
 * TODO:
 *  1. Extend courseMap fully
 *
 * Engineering and Technology
 * Computer Science and Related
 * Natural Sciences
 * Business and Economics
 * Humanities and Arts
 * Health and Medicine
 * Social Sciences
 * Miscellaneous:
 */

import { cn } from "@/lib/utils"

import { TableCell } from "./ui/table"

const courseMap = {
  CC: { borderLeft: "border-l-red-500", text: "text-red-600" },
  SC: { borderLeft: "border-l-emerald-500", text: "text-emerald-600" },
  PH: { borderLeft: "border-l-yellow-500", text: "text-yellow-600" },
  MH: { borderLeft: "border-l-blue-500", text: "text-blue-600" }
}

function getCourseStyle(key: string) {
  return Object.keys(courseMap).find((objK) => objK === key)
    ? courseMap[key as keyof typeof courseMap]
    : { borderLeft: "border-l-gray-500", text: "text-gray-600" } // fallback style
}

interface StarsCellProp extends React.HTMLAttributes<HTMLTableCellElement> {
  course: {
    start: string
    end: string
    rowSpan: number
    day: number
    courseCode: string
    courseTitle: string
    location: string
    time: string
  }
}

export default function StarsCell(props: StarsCellProp) {
  const { rowSpan, courseCode, location, time } = props.course

  const coursePrefix = courseCode.replace(/[^a-zA-Z]+/g, "") // used as key
  const courseStyle = getCourseStyle(coursePrefix)

  return (
    <TableCell
      {...props}
      rowSpan={rowSpan}
      className={cn(
        "break-words border border-l-2 border-slate-300 dark:border-y-slate-800 dark:border-r-slate-800 ",
        courseStyle.borderLeft,
        props.className
      )}>
      <p>
        <span className={cn("font-bold", courseStyle.text)}>{courseCode} </span>

        {location}
      </p>

      <p>{time}</p>
    </TableCell>
  )
}
