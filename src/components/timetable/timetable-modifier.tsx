"use client"

import { useState, type MouseEvent } from "react"
import { useBoundState } from "@/state/bound.state"
import { Trash2 } from "lucide-react"

import { track } from "@/lib/analytics"
import { getRemarkScope, REMARK_SCOPE_DOT_CLASS } from "@/lib/remark-scope"
import { cn } from "@/lib/utils"
import { useTimetable } from "@/hooks/use-timetable"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

import CustomCourseEditor from "./custom-course-editor"
import InfoTip from "./info-tip"
import TimetableGenerationConfig from "./mode-generation/timetable-generation-config"
import { RemarkTooltipContent } from "./remark-tooltip-content"
import TimetableDayRoute from "./timetable-day-route"
import TimetableIndexModifier from "./timetable-index-modifier"
import TimetableModulesSelect from "./timetable-modules-select"

interface ModuleRowProps {
  moduleKey: string
  indexKey: string
  isActive: boolean
  onOpenChange: (moduleKey: string) => void
  onRemove: (event: MouseEvent<HTMLDivElement>, moduleKey: string) => void
}

const ModuleRow = ({
  moduleKey,
  indexKey,
  isActive,
  onOpenChange,
  onRemove
}: ModuleRowProps) => {
  const moduleRemark = useBoundState((s) => s.moduleRemarks[moduleKey])
  const indexRemark = useBoundState(
    (s) => s.indexRemarks[`${moduleKey}:${indexKey}`]
  )
  const remarkScope = getRemarkScope(moduleRemark, indexRemark)
  const hasRemark = remarkScope !== null

  const rowDiv = (
    <div
      className={cn(
        "hover:bg-accent cursor-pointer pr-3 pl-4 text-sm transition-colors",
        isActive && "bg-muted"
      )}>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="w-16 font-medium">{moduleKey}</div>
          <div className="text-muted-foreground text-sm tabular-nums">
            {indexKey}
          </div>
          {remarkScope && (
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                REMARK_SCOPE_DOT_CLASS[remarkScope]
              )}
              aria-label={
                remarkScope === "module"
                  ? "Has a note (all indexes)"
                  : "Has a note (this index)"
              }
            />
          )}
        </div>

        <div
          className="flex size-8 cursor-pointer items-center justify-center"
          onClick={(e) => onRemove(e, moduleKey)}>
          <Trash2 className="text-muted-foreground hover:text-foreground size-4 transition-colors" />
        </div>
      </div>
    </div>
  )

  const indexModifier = (
    <TimetableIndexModifier
      moduleKey={moduleKey}
      open={isActive}
      onOpenChange={onOpenChange}>
      {rowDiv}
    </TimetableIndexModifier>
  )

  // Don't show the hover summary while the index picker for this same row
  // is already open — that popover already exposes the note field, so a
  // tooltip on top of it would just be noise.
  if (!hasRemark || isActive) return indexModifier

  // The trigger has to be a plain wrapping element rather than
  // TimetableIndexModifier itself — Radix's asChild clones its hover
  // listeners onto its single child, and TimetableIndexModifier is a plain
  // component that doesn't forward unknown props down to a DOM node, so
  // they'd never attach. A wrapping div works because pointer
  // enter/leave fire on it directly regardless of what's nested inside.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>{indexModifier}</div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-56 space-y-1 text-left">
        <RemarkTooltipContent
          moduleRemark={moduleRemark}
          indexRemark={indexRemark}
        />
      </TooltipContent>
    </Tooltip>
  )
}

interface ModifierProps {
  /** Sections side by side (panel below the grid) instead of stacked. */
  horizontal?: boolean
}

const ALL_SECTIONS = ["modules", "custom", "generate"]
const triggerClass =
  "items-center px-4 py-3.5 font-semibold hover:no-underline [&>svg]:translate-y-0"
// A header that is only a title: no chevron, no click.
const fixedTrigger = "pointer-events-none [&>svg]:hidden"

const TimetableModifier = ({ horizontal = false }: ModifierProps) => {
  const [open, setOpen] = useState(ALL_SECTIONS)
  const { timetable, removeItemFromTimetable } = useTimetable()
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const handleRemoveClick = (
    event: MouseEvent<HTMLDivElement>,
    moduleKey: string
  ) => {
    event.stopPropagation()
    removeItemFromTimetable(moduleKey)
    track("module_removed", {
      module_code: moduleKey,
      source: "timetable_sidebar"
    })
  }

  const count = Object.keys(timetable).length

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex w-full flex-col">
        {/* Module search: always shown */}
        <div className="relative z-2 mb-3 h-10 w-full shrink-0 rounded-lg">
          <div className="absolute top-0 left-0 w-full">
            <TimetableModulesSelect />
          </div>
        </div>

        {/* No side padding on the card: rows highlight edge to edge. Their text,
          and everything that is not a row, is inset 16px to match the headers. */}
        <div
          className={cn(
            "bg-card panel-border rounded-lg",
            horizontal && "grid grid-cols-4"
          )}>
          <Accordion
            type="multiple"
            // Side by side everything stays open and the headers are plain titles.
            value={horizontal ? ALL_SECTIONS : open}
            onValueChange={(v) => !horizontal && setOpen(v)}
            className={horizontal ? "contents" : undefined}>
            <AccordionItem
              value="modules"
              className={cn(horizontal && "border-b-0")}>
              <AccordionTrigger
                headingAs="h2"
                className={cn(triggerClass, horizontal && fixedTrigger)}
                tabIndex={horizontal ? -1 : undefined}>
                <span className="inline-flex items-center">
                  Registered modules
                  {count > 0 && (
                    <span className="text-muted-foreground ml-1.5 text-xs font-normal tabular-nums">
                      {count}
                    </span>
                  )}
                  <InfoTip title="Registered modules">
                    The modules in this plan. Click one to see its indexes and
                    change it.
                  </InfoTip>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <TooltipProvider>
                  <div className="max-h-[40vh] overflow-y-auto">
                    {Object.entries(timetable).map(([moduleKey, indexKey]) => (
                      <ModuleRow
                        key={moduleKey}
                        moduleKey={moduleKey}
                        indexKey={indexKey}
                        isActive={activeKey === moduleKey}
                        onOpenChange={setActiveKey}
                        onRemove={handleRemoveClick}
                      />
                    ))}
                  </div>
                </TooltipProvider>

                {count === 0 && (
                  <p className="text-muted-foreground px-4 py-2 text-center text-sm">
                    Add modules using the search above.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="custom"
              className={cn(horizontal && "border-b-0 border-l")}>
              <AccordionTrigger
                headingAs="h2"
                className={cn(triggerClass, horizontal && fixedTrigger)}
                tabIndex={horizontal ? -1 : undefined}>
                <span className="inline-flex items-center">
                  Custom blocks
                  <InfoTip title="Custom blocks">
                    Add your own blocks, like CCA, gym or an outside class. They
                    show on the grid and count towards clashes.
                  </InfoTip>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <CustomCourseEditor />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="generate"
              className={cn(
                "last:border-b",
                horizontal && "border-b-0 border-l last:border-b-0"
              )}>
              <AccordionTrigger
                headingAs="h2"
                className={cn(triggerClass, horizontal && fixedTrigger)}
                tabIndex={horizontal ? -1 : undefined}>
                <span className="inline-flex items-center">
                  Generate timetable
                  <InfoTip title="Generate timetable">
                    Set your preferences, then build clash-free combinations
                    from your modules.
                  </InfoTip>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div
                  // Nothing to generate from: dimmed and out of reach.
                  inert={count === 0}
                  className={cn(
                    "px-4 transition-opacity",
                    count === 0 && "pointer-events-none opacity-50"
                  )}>
                  <TimetableGenerationConfig />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* The map stays open: same header and divider, no toggle. */}
          <div className={cn(horizontal && "border-l")}>
            <h2 className="px-4 py-3.5 text-sm font-semibold">
              Walking between classes
              <InfoTip title="Walking between classes">
                See your day on the campus map and whether each gap is long
                enough to walk it.
              </InfoTip>
            </h2>
            <div className="pb-3">
              <div
                inert={count === 0}
                className={cn(
                  "px-4 transition-opacity",
                  count === 0 && "pointer-events-none opacity-50"
                )}>
                <TimetableDayRoute />
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default TimetableModifier
