"use client"

import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"

import { TimetableTableCellContent } from "./cell-content"

interface Props {
  moduleKey: string
  index: Index
  indexes: Index[]
  fullCell?: boolean
  dimmed?: boolean
  moduleKeyText?: string
  hideIndex?: boolean
  //
  onMouseOver?: () => void
  onMouseOut?: () => void
  onClick?: () => void
  previewCandidate?: boolean
  previewActive?: boolean
}

export const TimetableTableCell = (props: Props) => {
  const {
    moduleKey,
    index,
    indexes = [], // used for variations checking
    // Styles
    fullCell, // override for user's settings
    dimmed = false,
    moduleKeyText = undefined,
    hideIndex = false,
    //
    onMouseOver,
    onMouseOut,
    onClick,
    previewCandidate = false,
    previewActive = false
  } = props

  // Settings for cells
  const { settings } = useSettings()
  const { tableCell } = settings

  // Sytling and Modifications
  const indexStyle = getIndexTypeStyle(index.type)

  // Variations
  const variations = indexes.filter(
    (i) => i.key === index.key && i.day === index.day && i.time === index.time
  )
  const hasDiffRemarks = variations.some(
    (v) => v.remarks !== index.remarks && v.remarks !== ""
  )
  const hasDiffVenues = variations.some((v) => v.venue !== index.venue)

  // If there are variations, we will render the cell with the differences
  const indexRemarks = hasDiffRemarks
    ? variations.map((x) => x.remarks).join(", ")
    : index.remarks

  const indexVenues = hasDiffVenues
    ? variations.map((x) => x.venue).join(", ")
    : index.venue

  return (
    <td
      rowSpan={index.duration}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      className="p-1">
      {/*  */}
      <div
        className={cn(
          "flex h-full cursor-pointer items-center rounded-lg p-[var(--cell-padding)] break-words",
          indexStyle.background,
          previewCandidate &&
            "opacity-50 ring-1 ring-foreground/30 hover:opacity-90",
          previewActive && "ring-2 ring-primary/70",
          dimmed && "opacity-30 dark:opacity-20"
        )}
        onClick={onClick}>
        <div className="w-full">
          {/*  */}
          <TimetableTableCellContent
            index={{
              ...index,
              remarks: indexRemarks,
              venue: indexVenues,
              key: hideIndex ? "" : index.key
            }}
            moduleKey={moduleKeyText ? moduleKeyText : moduleKey}
            tableCell={
              fullCell
                ? {
                    key: true,
                    type: true,
                    group: true,
                    day: true,
                    time: true,
                    venue: true,
                    remarks: true,
                    duration: false // always false
                  }
                : tableCell
            }
          />
        </div>
      </div>
    </td>
  )
}
