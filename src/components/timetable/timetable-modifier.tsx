"use client"

import { lazy, Suspense, useState, type MouseEvent } from "react"
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
import { RemarkTooltipContent } from "./remark-tooltip-content"
import TimetableDayRoute from "./timetable-day-route"
import TimetableIndexModifier from "./timetable-index-modifier"
import TimetableModulesSelect from "./timetable-modules-select"

const TimetableGenerationConfig = lazy(
  () => import("./mode-generation/timetable-generation-config")
)

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

const TimetableModifier = () => {
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
    <div className="flex size-full flex-col">
      {/* Module search: always shown */}
      <div className="relative z-2 mb-3 h-10 w-full rounded-lg">
        <div className="absolute top-0 left-0 w-full">
          <TimetableModulesSelect />
        </div>
      </div>

      {/* No side padding on the card: rows highlight edge to edge. Their text,
          and everything that is not a row, is inset 16px to match the headers. */}
      <div className="bg-card rounded-lg border">
        <Accordion
          type="multiple"
          defaultValue={["modules", "custom", "generate"]}>
          <AccordionItem value="modules">
            <AccordionTrigger className="items-center px-4 py-3.5 font-semibold hover:no-underline [&>svg]:translate-y-0">
              <span>
                Registered modules
                {count > 0 && (
                  <span className="text-muted-foreground ml-1.5 text-xs font-normal tabular-nums">
                    {count}
                  </span>
                )}
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
                  You have not added modules
                  <br /> Click on the search bar above to add modules
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="custom">
            <AccordionTrigger className="items-center px-4 py-3.5 font-semibold hover:no-underline [&>svg]:translate-y-0">
              Custom blocks
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <CustomCourseEditor />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="generate" className="last:border-b">
            <AccordionTrigger className="items-center px-4 py-3.5 font-semibold hover:no-underline [&>svg]:translate-y-0">
              Generate timetable
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="px-4">
                <Suspense fallback={null}>
                  <TimetableGenerationConfig />
                </Suspense>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* The map stays open: same header and divider, no toggle. */}
        <div>
          <h2 className="px-4 py-3.5 text-sm font-semibold">
            Walking between classes
          </h2>
          <div className="pb-3">
            <div className="px-4">
              <TimetableDayRoute />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimetableModifier
