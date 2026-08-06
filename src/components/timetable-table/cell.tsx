"use client"

import { useBoundState } from "@/state/bound.state"

import {
  CUSTOM_BLOCK_STYLE,
  isCustomCourseKey,
  PRESET_INDEX_TYPES
} from "@/lib/custom-course-colors"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"

import { TimetableTableCellContent } from "./cell-content"

interface Props {
  moduleKey: string
  index: Index
  indexes: Index[]
  fullCell?: boolean
  dimmed?: boolean
  moduleKeyText?: string
  hideIndex?: boolean
  /** Locks the cell to exactly `duration * clampCellHeightPx`, clipping
   * overflow — used by the "standardised scale" setting so every 30 min
   * timeslot stays the same height regardless of text length. */
  clampCellHeightPx?: number
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
    clampCellHeightPx,
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
  const customRemark = indexRemark || moduleRemark || undefined

  // Styling and Modifications
  const isCustom = isCustomCourseKey(moduleKey)
  const indexStyle = getIndexTypeStyle(index.type)

  // Custom blocks: preset types use their color scheme; custom-text gets purple
  const backgroundClass = isCustom
    ? (PRESET_INDEX_TYPES.has(index.remarks)
        ? getIndexTypeStyle(index.remarks)!
        : CUSTOM_BLOCK_STYLE
      ).background
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

  const cellContent = (
    <div
      className={cn(
        "flex h-full cursor-pointer items-center rounded-lg p-[var(--cell-padding)] break-words",
        backgroundClass,
        clampCellHeightPx && "overflow-hidden",
        previewCandidate &&
          "ring-primary/80 hover:ring-primary shadow-md ring-1",
        previewActive && "ring-primary shadow-lg ring-1",
        dimmed && "opacity-30 dark:opacity-20",
        pickerDimmed && "pointer-events-none opacity-[0.12] dark:opacity-[0.08]"
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
          customRemark={customRemark}
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
      style={
        clampCellHeightPx
          ? { height: clampCellHeightPx * index.duration }
          : undefined
      }
      className={cn("p-1", clampCellHeightPx && "overflow-hidden")}>
      {moduleRemark || indexRemark ? (
        <Tooltip>
          <TooltipTrigger asChild>{cellContent}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-56 space-y-1 text-left">
            {moduleRemark && (
              <p>
                <span className="font-semibold">Module: </span>
                {moduleRemark}
              </p>
            )}
            {indexRemark && (
              <p>
                <span className="font-semibold">Index: </span>
                {indexRemark}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      ) : (
        cellContent
      )}
    </td>
  )
}
