import { TRUN_DAY_MAP } from "@/lib/constants"
import {
  getCustomBlockStyle,
  isCustomCourseKey
} from "@/lib/custom-course-colors"
import { formatRemarks } from "@/lib/format"
import { getIndexType } from "@/lib/get-index-type"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { cn } from "@/lib/utils"

interface Props {
  index: Index
  moduleKey: string
  /** A lecture every index of the module shares. */
  common?: boolean
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
    common = false,
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
  const indexStyle = getIndexTypeStyle(index.type)

  if (isCustom) {
    const sessionLabel = index.remarks.length > 0 ? index.remarks : null
    const style = getCustomBlockStyle(index.remarks)
    return (
      <>
        <p>
          <span className={cn("font-bold", style.text)}>{index.group}</span>
          {sessionLabel && (
            <span className={cn(style.textAlt)}> {sessionLabel}</span>
          )}
        </p>
        {tableCell.time && <p className={cn(style.textAlt)}>{index.time}</p>}
        {tableCell.venue && index.venue && <p>{index.venue}</p>}
      </>
    )
  }

  return (
    <>
      <p>
        <span className={cn("font-bold", indexStyle.text)}>{moduleKey}</span>

        {tableCell.type && (
          <span className={cn(indexStyle.textAlt)}>
            {" "}
            {getIndexType(index.type)}
          </span>
        )}

        {common ? (
          <span className={cn(indexStyle.textAlt)}> (COM)</span>
        ) : (
          tableCell.group && <> ({index.group})</>
        )}
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
