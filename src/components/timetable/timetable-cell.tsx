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
  tdClassName?: string
  fullCell?: boolean
  hideTimeDate?: boolean
  overrideIndex?: React.ReactNode
  indexes?: Index[]
  onMouseOver?: () => void
  onMouseOut?: () => void
  dimmed?: boolean
}

const TimetableCell = (props: Props) => {
  const {
    // Required Props
    moduleKey,
    index,
    // Customization
    divClassName,
    tdClassName,
    fullCell = false,
    hideTimeDate = false,
    overrideIndex = null,
    // Variations Chekcing
    indexes = [],
    // Dimming Effects
    onMouseOver = undefined,
    onMouseOut = undefined,
    dimmed = false
  } = props
  const indexStyle = getIndexTypeStyle(index.type)

  const { settings } = useSettings()
  const { tableCell } = settings

  const variations = indexes.filter(
    (item) =>
      item.key === index.key &&
      item.day === index.day &&
      item.time === index.time
  )
  const hasDifferenceInRemarks = variations.some(
    (v) => v.remarks !== index.remarks && v.remarks !== ""
  )
  const hasDifferenceInVenue = variations.some((v) => v.venue !== index.venue)

  /**
   * The actual rendered table-cell
   */
  return (
    <td
      className={cn("p-1", tdClassName)}
      rowSpan={index.duration}
      onMouseOut={onMouseOut}
      onMouseOver={onMouseOver}>
      <div
        className={cn(
          "flex h-full cursor-pointer items-center break-words rounded-lg p-[var(--cell-padding)]",
          indexStyle.background,
          divClassName,
          dimmed && "opacity-30 dark:opacity-20"
        )}>
        <div className="w-full">
          <>
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

            {hideTimeDate ? (
              <></>
            ) : (
              <p>
                {(fullCell || tableCell.time) && <>{index.time}</>}

                {(fullCell || tableCell.day) && index.day > 0 && (
                  <> {TRUN_DAY_MAP[index.day as keyof typeof TRUN_DAY_MAP]}</>
                )}
              </p>
            )}

            <p>
              {(fullCell || tableCell.venue) && (
                <>
                  {variations.length === 0 ? (
                    <>{index.venue}</>
                  ) : (
                    hasDifferenceInVenue &&
                    variations.map((x) => x.venue).join(", ")
                  )}
                </>
              )}
            </p>

            <p>
              {(fullCell || tableCell.remarks) && (
                <>
                  {variations.length === 0 ? (
                    <>{formatRemarks(index.remarks)}</>
                  ) : (
                    hasDifferenceInRemarks &&
                    variations.map((x) => formatRemarks(x.remarks)).join(", ")
                  )}
                </>
              )}
            </p>

            {overrideIndex
              ? overrideIndex
              : (fullCell || tableCell.key) && <p>{index.key}</p>}
          </>
        </div>
      </div>
    </td>
  )
}

export default TimetableCell
