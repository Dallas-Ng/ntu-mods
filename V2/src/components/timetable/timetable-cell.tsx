"use client"

import { TRUN_DAY_MAP } from "@/lib/constants"
import { formatRemarks } from "@/lib/format"
import { getIndexType } from "@/lib/get-index-type"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"

interface Props {
  moduleKey: string
  index: Index
  divClassName?: string
  fullCell?: boolean
}

// TODO: Variations

const TimetableCell = (props: Props) => {
  const { moduleKey, index, divClassName, fullCell = false } = props
  const indexStyle = getIndexTypeStyle(index.type)

  const { settings } = useSettings()
  const { tableCell } = settings

  return (
    <td className="p-1" rowSpan={index.duration}>
      <div
        className={cn(
          "flex h-full cursor-pointer items-center break-words rounded-lg p-1 transition-colors md:px-3",
          indexStyle.background,
          divClassName
        )}>
        <div className="w-full">
          <p>
            <span className={cn("font-bold", indexStyle.text)}>
              {moduleKey}
            </span>

            {(fullCell || tableCell.type) && (
              <span className={cn("font-semibold", indexStyle.textAlt)}>
                {" "}
                {getIndexType(index.type)}
              </span>
            )}

            {(fullCell || tableCell.group) && <> ({index.group})</>}
          </p>

          <p>
            {(fullCell || tableCell.time) && <>{index.time}</>}

            {(fullCell || tableCell.day) && index.day > 0 && (
              <> {TRUN_DAY_MAP[index.day]}</>
            )}
          </p>

          <p>
            {(fullCell || tableCell.venue) && <>{index.venue}</>}

            {(fullCell || tableCell.remarks) && index.remarks !== "" && (
              <> - {formatRemarks(index.remarks)}</>
            )}
          </p>

          {(fullCell || tableCell.key) && <p>{index.key}</p>}
        </div>
      </div>
    </td>
  )
}

export default TimetableCell
