import {
  CUSTOM_COURSE_COLORS,
  isCustomCourseKey
} from "@/lib/custom-course-colors"
import { TRUN_DAY_MAP } from "@/lib/constants"
import { formatRemarks } from "@/lib/format"
import { getIndexType } from "@/lib/get-index-type"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { cn } from "@/lib/utils"

interface Props {
  index: Index
  moduleKey: string
  tableCell?: {
    key: boolean
    type: boolean
    group: boolean
    day: boolean
    time: boolean
    venue: boolean
    remarks: boolean
    duration: boolean
  }
}

export const TimetableTableCellContent = (props: Props) => {
  const {
    moduleKey,
    index,
    tableCell = {
      key: true,
      type: true,
      group: true,
      day: true,
      time: true,
      venue: true,
      remarks: true,
      duration: true
    }
  } = props

  const isCustom = isCustomCourseKey(moduleKey)
  const customStyle = isCustom
    ? CUSTOM_COURSE_COLORS[(index.color as CustomCourseColor) ?? "violet"]
    : null
  const indexStyle = getIndexTypeStyle(index.type)

  if (isCustom) {
    return (
      <>
        <p>
          <span className={cn("font-bold", customStyle!.text)}>
            {index.group}
          </span>
        </p>
        {tableCell.time && (
          <p className={cn(customStyle!.textAlt)}>{index.time}</p>
        )}
        {tableCell.venue && index.venue && <p>{index.venue}</p>}
      </>
    )
  }

  return (
    <>
      <p>
        <span className={cn("font-bold", indexStyle.text)}>{moduleKey}</span>

        {tableCell.type && (
          <span className={cn("font-semibold", indexStyle.textAlt)}>
            {" "}
            {getIndexType(index.type)}
          </span>
        )}

        {tableCell.group && <> ({index.group})</>}
      </p>

      <p>
        {tableCell.time && <>{index.time}</>}

        {tableCell.day && index.day > 0 && (
          <> {(TRUN_DAY_MAP as Record<number, string>)[index.day]}</>
        )}
      </p>

      {tableCell.venue && <p>{index.venue}</p>}

      {tableCell.remarks && <p>{formatRemarks(index.remarks)}</p>}

      {tableCell.key && <p>{index.key}</p>}
    </>
  )
}
