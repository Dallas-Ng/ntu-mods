"use client"

import { useBoundState } from "@/state/bound.state"

import {
  getCustomBlockStyle,
  isCustomCourseKey
} from "@/lib/custom-course-colors"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { getRemarkScope, REMARK_SCOPE_DOT_CLASS } from "@/lib/remark-scope"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { RemarkTooltipContent } from "@/components/timetable/remark-tooltip-content"

import { TimetableTableCellContent } from "./cell-content"

interface Props {
  moduleKey: string
  index: Index
  indexes: Index[]
  fullCell?: boolean
  dimmed?: boolean
  moduleKeyText?: string
  hideIndex?: boolean
  /** Per-30-min-unit height baseline. Always applied as a minimum so a
   * block's coloured area reaches its full duration even when its own
   * text is short — fixes rowSpan cells otherwise collapsing to the
   * height of whatever little content sits in the rows they span. */
  rowHeightPx: number
  /** Locks the cell to exactly `duration * rowHeightPx`, clipping overflow
   * — used by the "standardised scale" setting so every 30 min timeslot
   * stays the same height regardless of text length. */
  clamp?: boolean
  //
  onMouseOver?: () => void
  onMouseOut?: () => void
  onClick?: () => void
  previewCandidate?: boolean
  previewActive?: boolean
  pickerDimmed?: boolean
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
    rowHeightPx,
    clamp = false,
    //
    onMouseOver,
    onMouseOut,
    onClick,
    previewCandidate = false,
    previewActive = false,
    pickerDimmed = false
  } = props

  // Settings for cells
  const { settings } = useSettings()
  const { tableCell } = settings

  const moduleRemark = useBoundState((s) => s.moduleRemarks[moduleKey])
  const indexRemark = useBoundState(
    (s) => s.indexRemarks[`${moduleKey}:${index.key}`]
  )
  const remarkScope = getRemarkScope(moduleRemark, indexRemark)
  const hasRemark = remarkScope !== null

  // Styling and Modifications
  const isCustom = isCustomCourseKey(moduleKey)
  const indexStyle = getIndexTypeStyle(index.type)

  // Custom blocks: preset types (and Lunch) use their own color scheme
  const backgroundClass = isCustom
    ? getCustomBlockStyle(index.remarks).background
    : indexStyle.background

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

  const cellHeightPx = rowHeightPx * index.duration

  const cellContent = (
    <div
      className={cn(
        "relative flex cursor-pointer items-center rounded-lg p-[var(--cell-padding)] break-words max-sm:p-1",
        clamp ? "overflow-hidden" : "h-full",
        backgroundClass,
        previewCandidate &&
          "ring-primary/80 hover:ring-primary shadow-md ring-1",
        previewActive && "ring-primary shadow-lg ring-1",
        dimmed && "opacity-30 dark:opacity-20",
        pickerDimmed && "pointer-events-none opacity-[0.12] dark:opacity-[0.08]"
      )}
      // h-full (100% of the td) is a no-op here: table cells always grow to
      // fit their content regardless of the td's own declared height, so
      // clamping needs the child to have its OWN fixed height + overflow
      // hidden — only then does the td's content height stay bounded to it,
      // instead of the overflowing text quietly dragging the whole row
      // (and every other column sharing it) taller.
      style={clamp ? { height: cellHeightPx } : undefined}
      onClick={onClick}>
      {remarkScope && (
        <span
          className={cn(
            "absolute top-1 right-1 size-1.5 rounded-full",
            REMARK_SCOPE_DOT_CLASS[remarkScope]
          )}
        />
      )}

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
  )

  return (
    <td
      rowSpan={index.duration}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      style={{ height: cellHeightPx }}
      className={cn("p-1", clamp && "overflow-hidden")}>
      {hasRemark ? (
        <Tooltip>
          <TooltipTrigger asChild>{cellContent}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-56 space-y-1 text-left">
            <RemarkTooltipContent
              moduleRemark={moduleRemark}
              indexRemark={indexRemark}
            />
          </TooltipContent>
        </Tooltip>
      ) : (
        cellContent
      )}
    </td>
  )
}
