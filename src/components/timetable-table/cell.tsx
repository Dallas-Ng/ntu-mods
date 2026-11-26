"use client"

import type { CSSProperties } from "react"
import { useBoundState } from "@/state/bound.state"

import { withAppearanceDefaults } from "@/config/appearance-settings"
import {
  getCustomBlockStyle,
  isCustomCourseKey
} from "@/lib/custom-course-colors"
import { getIndexColorKey } from "@/lib/get-index-type"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { TRUN_DAY_MAP } from "@/lib/module-constants"
import {
  clampOpacity,
  getActiveOverride,
  getModuleCellVars
} from "@/lib/index-type-colors"
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
  /** A lecture every index of the module shares: labelled "Common". */
  common?: boolean
  hideIndex?: boolean
  /**
   * Per-30-min-unit height baseline. Always applied as a minimum so a block's
   * coloured area reaches its full duration even when its own text is short —
   * fixes rowSpan cells otherwise collapsing to the height of whatever little
   * content sits in the rows they span.
   */
  rowHeightPx: number
  /**
   * Locks the cell to exactly `duration * rowHeightPx`, clipping overflow —
   * used by the "standardised scale" setting so every 30 min timeslot stays the
   * same height regardless of text length.
   */
  clamp?: boolean
  //
  onMouseOver?: () => void
  onMouseOut?: () => void
  onClick?: () => void
  previewCandidate?: boolean
  previewActive?: boolean
  pickerDimmed?: boolean
  /** Shown only because an index is hovered in the picker, not selected. */
  hoverState?: "preview" | "current"
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
    common = false,
    hideIndex = false,
    rowHeightPx,
    clamp = false,
    //
    onMouseOver,
    onMouseOut,
    onClick,
    previewCandidate = false,
    previewActive = false,
    pickerDimmed = false,
    hoverState
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
  const appearance = withAppearanceDefaults(settings.appearance)
  const colourKey = getIndexColorKey(index.type)

  // A module can tint its own blocks. Its vars go inline so they win over the
  // palette on :root, and custom properties inherit into the text inside.
  const moduleVars = isCustom
    ? undefined
    : getModuleCellVars(appearance, moduleKey, colourKey)

  // Opacity fades the whole block, text included. It goes through a variable
  // so the dimmed and hover states can still multiply on top of it.
  const activeOverride = isCustom
    ? undefined
    : getActiveOverride(appearance, colourKey, moduleKey)
  const blockOpacity =
    activeOverride?.opacity == null
      ? 1
      : clampOpacity(activeOverride.opacity) / 100

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

  const cellStyle = {
    ...(moduleVars as CSSProperties | undefined),
    "--cell-block-opacity": String(blockOpacity),
    ...(clamp ? { height: cellHeightPx } : {})
  } as CSSProperties

  const CellBlock = onClick ? "button" : "div"
  const cellContent = (
    <CellBlock
      type={onClick ? "button" : undefined}
      disabled={onClick && pickerDimmed ? true : undefined}
      aria-label={
        onClick
          ? `${isCustom ? index.group : (moduleKeyText ?? moduleKey)}, ${TRUN_DAY_MAP[index.day as keyof typeof TRUN_DAY_MAP] ?? ""} ${index.time}${hideIndex || !index.key ? "" : `, index ${index.key}`}`
          : undefined
      }
      className={cn(
        // Mobile always renders compact (0.25rem, matching the "Compact"
        // density preset) regardless of the user's chosen density — cells
        // are too small on a phone screen to afford Comfortable/Spacious
        // padding. The density setting only takes effect from md: up.
        "relative flex w-full items-center rounded-lg p-[0.25rem] text-left break-words md:p-[var(--cell-padding)]",
        onClick &&
          "focus-visible:outline-foreground cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2",
        clamp ? "overflow-hidden" : "h-full",
        // The block's own opacity, composed with any dimmed state through
        // --cell-state-opacity. Values live in CSS so the dark variants stay.
        "opacity-[calc(var(--cell-block-opacity,1)*var(--cell-state-opacity,1))]",
        backgroundClass,
        previewCandidate &&
          "ring-primary/80 hover:ring-primary shadow-md ring-1",
        previewActive && "ring-primary shadow-lg ring-1",
        hoverState === "preview" &&
          "outline-primary outline-2 -outline-offset-2 outline-dashed",
        hoverState === "current" &&
          "outline-foreground/50 outline-2 -outline-offset-2",
        dimmed && "[--cell-state-opacity:0.3] dark:[--cell-state-opacity:0.2]",
        pickerDimmed &&
          "pointer-events-none [--cell-state-opacity:0.12] dark:[--cell-state-opacity:0.08]"
      )}
      // h-full (100% of the td) is a no-op here: table cells always grow to
      // fit their content regardless of the td's own declared height, so
      // clamping needs the child to have its OWN fixed height + overflow
      // hidden — only then does the td's content height stay bounded to it,
      // instead of the overflowing text quietly dragging the whole row
      // (and every other column sharing it) taller.
      style={cellStyle}
      onClick={onClick}>
      {remarkScope && (
        <span
          className={cn(
            "absolute top-1 right-1 size-1.5 rounded-full",
            REMARK_SCOPE_DOT_CLASS[remarkScope]
          )}
        />
      )}

      <span
        className="block w-full"
        data-cell-fit
        data-duration={index.duration}>
        {/*  */}
        <TimetableTableCellContent
          index={{
            ...index,
            remarks: indexRemarks,
            venue: indexVenues,
            key: hideIndex ? "" : index.key
          }}
          moduleKey={moduleKeyText ? moduleKeyText : moduleKey}
          common={common}
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
      </span>
    </CellBlock>
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
