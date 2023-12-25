import { cn } from "@/lib/utils"

import { TableCell } from "../ui/table"

interface StarsCellProp extends React.HTMLAttributes<HTMLTableCellElement> {
  courseKey: string
  index: Index
  hasConflict?: boolean
  coursesToIndex: { [courseKey: string]: Index[] }
}

export default function StarsCell(props: StarsCellProp) {
  const { courseKey, index, hasConflict = false, coursesToIndex } = props

  const courseStyle = index.type.includes("LEC")
    ? {
        borderLeft: "border-l-orange-500",
        text: "text-orange-600",
        background: "bg-orange-200"
      }
    : index.type.includes("LAB")
      ? {
          borderLeft: "border-l-emerald-500",
          text: "text-emerald-600",
          background: "bg-emerald-200"
        }
      : index.type.includes("SEM")
        ? {
            borderLeft: "border-l-yellow-500",
            text: "text-yellow-600",
            background: "bg-yellow-200"
          }
        : index.type.includes("TUT")
          ? {
              borderLeft: "border-l-blue-500",
              text: "text-blue-600",
              background: "bg-blue-200"
            }
          : {
              borderLeft: "border-l-gray-500",
              text: "text-gray-600",
              background: "bg-gray-200"
            }

  // When a index has multiple variations thats suppose to show in the same cell,
  // e.g. week 1-7 is at LT4, week 9-13 is at LT5...
  const variations = coursesToIndex[courseKey].filter(
    (item) => item.day === index.day && item.time === index.time
  )

  const StarCellWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <TableCell
        // {...props}
        key={index.key}
        rowSpan={index.duration}
        className={cn(
          "break-words border border-l-2 border-slate-300 p-1 dark:border-y-slate-800 dark:border-r-slate-800 md:p-2 ",
          hasConflict && "border-b-2 border-b-red-600 dark:border-b-red-600",
          courseStyle.borderLeft,
          props.className
        )}>
        {children}
      </TableCell>
    )
  }

  const StarCellData = (index: Index) => (
    <>
      <p>
        <span className={cn("font-bold", courseStyle.text)}>{courseKey}</span>{" "}
        {index.type} ({index.group})
      </p>

      <p>{index.time}</p>

      <p>{index.venue}</p>

      {/* <p>
        {index.key} - {index.day}
      </p> */}
      {index.remarks.replace("Teaching", "")}
    </>
  )

  if (variations.length > 1) {
    return (
      <StarCellWrapper>
        {variations.map((item, key) => (
          <div className="mt-1" key={key}>
            {StarCellData(item)}
          </div>
        ))}
      </StarCellWrapper>
    )
  }

  return <StarCellWrapper>{StarCellData(index)}</StarCellWrapper>
}
