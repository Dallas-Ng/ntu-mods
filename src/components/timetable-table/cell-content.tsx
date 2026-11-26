import {
  getCustomBlockStyle,
  isCustomCourseKey
} from "@/lib/custom-course-colors"
import { formatRemarks } from "@/lib/format"
import { getIndexType } from "@/lib/get-index-type"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { TRUN_DAY_MAP } from "@/lib/module-constants"
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
        <span className="block">
          <span className={cn("font-bold", style.text)}>{index.group}</span>
          {sessionLabel && (
            <span className={cn(style.textAlt)}> {sessionLabel}</span>
          )}
        </span>
        {tableCell.time && (
          <span className={cn("block", style.textAlt)}>{index.time}</span>
        )}
        {tableCell.venue && index.venue && (
          <span className="block">{index.venue}</span>
        )}
      </>
    )
  }

  return (
    <>
      <span className="block">
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
      </span>

      <span className="block">
        {tableCell.time && <>{index.time}</>}

        {tableCell.day && index.day > 0 && (
          <> {(TRUN_DAY_MAP as Record<number, string>)[index.day]}</>
        )}
      </span>

      {tableCell.venue && <span className="block">{index.venue}</span>}

      {tableCell.remarks && (
        <span className="block">{formatRemarks(index.remarks)}</span>
      )}

      {tableCell.key && <span className="block">{index.key}</span>}
    </>
  )
}
