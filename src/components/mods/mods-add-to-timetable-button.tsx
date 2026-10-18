"use client"

import { useState } from "react"
import { CalendarCheck, CalendarPlus, Check } from "lucide-react"

import { track } from "@/lib/analytics"
import { resolveBestIndex } from "@/lib/resolve-best-index"
import { cn } from "@/lib/utils"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

interface Props {
  moduleKey: string
  year: string
  semester: string
  /** Explicitly show/hide button text. Omit for responsive (icon-only on mobile, text on desktop). */
  showText?: boolean
  /** Extra classes applied to the trigger Button element. */
  triggerClassName?: string
  /** Override the trigger Button variant. Defaults to outline/secondary based on plan state. */
  triggerVariant?: "outline" | "ghost" | "secondary"
  /**
   * This module's own indexes, when already available (e.g. server-fetched on the
   * mod detail page). Lets the button render its enabled/disabled state without
   * waiting on the full season indexes fetch.
   */
  moduleIndexes?: Record<string, Index[]>
}

function PlanItems({
  timetables,
  moduleKey,
  onSelect
}: {
  timetables: Timetable[]
  moduleKey: string
  onSelect: (i: number) => void
}) {
  return (
    <>
      {timetables.map((plan, i) => {
        const inPlan = plan[moduleKey] != null
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors">
            <Check
              className={`size-3.5 transition-opacity ${inPlan ? "opacity-100" : "opacity-0"}`}
            />
            Plan {i + 1}
          </button>
        )
      })}
    </>
  )
}

const ModsAddToTimetableButton = ({
  moduleKey,
  year,
  semester,
  showText,
  triggerClassName,
  triggerVariant,
  moduleIndexes: moduleIndexesProp
}: Props) => {
  const { timetables, updateTimetable } = useTimetable()
  const { isMobile } = useSettings()
  const [open, setOpen] = useState(false)
  // The season-wide index file is over 1 MB. List pages render dozens of these
  // buttons, so fetch it only once the plan picker opens (or if another part of
  // the page already did), not on mount.
  const { indexes: seasonIndexes, isLoading: seasonLoading } = useSeasonIndexes(
    year,
    semester,
    moduleIndexesProp == null && open
  )

  const moduleIndexes = moduleIndexesProp ?? seasonIndexes[moduleKey]
  const isLoading = moduleIndexesProp == null && seasonLoading
  // Until the season file has loaded, keep the button enabled: whether the
  // module has a schedule is only known after the first open.
  const seasonLoaded = Object.keys(seasonIndexes).length > 0
  const hasIndexes =
    moduleIndexesProp == null && !seasonLoaded
      ? true
      : !isLoading && moduleIndexes && Object.keys(moduleIndexes).length > 0
  const inAnyPlan = timetables.some((t) => t[moduleKey] != null)

  const handlePlanClick = (planIndex: number) => {
    if (!moduleIndexes) return
    const plan = timetables[planIndex]
    if (plan[moduleKey]) {
      const { [moduleKey]: _, ...rest } = plan
      updateTimetable(rest, planIndex)
      track("module_removed", {
        module_code: moduleKey,
        source: "mods_page"
      })
    } else {
      const bestIndex = resolveBestIndex(moduleIndexes, plan, seasonIndexes)
      updateTimetable({ ...plan, [moduleKey]: bestIndex }, planIndex)
      track("module_added", {
        module_code: moduleKey,
        index_key: bestIndex,
        total_modules: Object.keys(plan).length + 1,
        source: "mods_page"
      })
    }
    // Intentionally don't close — user may want to add to multiple plans
  }

  const textEl = (() => {
    const label = inAnyPlan ? "In timetable" : "Add to timetable"
    if (showText === true) return <span>{label}</span>
    if (showText === false) return null
    return <span className="hidden sm:inline">{label}</span>
  })()

  const triggerBtn = (
    <Button
      variant={triggerVariant ?? (inAnyPlan ? "secondary" : "outline")}
      size="sm"
      disabled={!hasIndexes}
      aria-label={inAnyPlan ? "In timetable" : "Add to timetable"}
      title={inAnyPlan ? "In timetable" : "Add to timetable"}
      className={cn("gap-1.5", triggerClassName)}>
      {inAnyPlan ? (
        <CalendarCheck className="text-primary size-3.5 shrink-0" />
      ) : (
        <CalendarPlus className="size-3.5 shrink-0" />
      )}
      {textEl}
    </Button>
  )

  const trigger = !hasIndexes ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("flex", triggerClassName && "h-full w-full")}>
            {triggerBtn}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">No schedule available</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    triggerBtn
  )

  const planItems = (
    <PlanItems
      timetables={timetables}
      moduleKey={moduleKey}
      onSelect={handlePlanClick}
    />
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="p-2 pb-6">
          <DrawerTitle className="text-muted-foreground mt-2 w-full text-center text-sm font-normal">
            Select a plan
          </DrawerTitle>
          {planItems}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-1">
        <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
          Select plan
        </p>
        {planItems}
      </PopoverContent>
    </Popover>
  )
}

export default ModsAddToTimetableButton
