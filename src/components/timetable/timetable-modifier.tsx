"use client"

import { lazy, Suspense, useState, type MouseEvent } from "react"
import { useBoundState } from "@/state/bound.state"
import { TrashIcon } from "lucide-react"
import posthog from "posthog-js"

import { getRemarkScope, REMARK_SCOPE_DOT_CLASS } from "@/lib/remark-scope"
import { cn } from "@/lib/utils"
import { useTimetable } from "@/hooks/use-timetable"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

import CustomCourseEditor from "./custom-course-editor"
import TimetableIndexModifier from "./timetable-index-modifier"
import TimetableModeSelector from "./timetable-mode-selector"
import TimetableModulesSelect from "./timetable-modules-select"

// Only rendered once the user switches mode — kept out of the initial
// bundle since generation config + AI chat pull in ~800+ lines and their
// own deps that the default "Calendar" mode never touches.
const TimetableAiChat = lazy(() => import("./mode-ai/timetable-ai-chat"))
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
        "hover:bg-accent cursor-pointer pr-1 pl-4 text-sm transition-colors",
        isActive && "bg-muted rounded-b-none"
      )}>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="w-15">{moduleKey}</div>
          <div className="text-muted-foreground text-sm">{indexKey}</div>
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
          className="flex size-10 cursor-pointer items-center justify-center p-1"
          onClick={(e) => onRemove(e, moduleKey)}>
          <TrashIcon className="text-muted-foreground hover:text-foreground size-4 transition-colors" />
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
        {moduleRemark && (
          <p>
            <span
              className={cn(
                "mr-1 inline-block size-1.5 rounded-full",
                REMARK_SCOPE_DOT_CLASS.module
              )}
            />
            <span className="font-semibold">Module: </span>
            {moduleRemark}
          </p>
        )}
        {indexRemark && (
          <p>
            <span
              className={cn(
                "mr-1 inline-block size-1.5 rounded-full",
                REMARK_SCOPE_DOT_CLASS.index
              )}
            />
            <span className="font-semibold">Index: </span>
            {indexRemark}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

const TimetableModifier = () => {
  const { timetable, removeItemFromTimetable } = useTimetable()
  const mode = useBoundState((s) => s.timetableCreationMode)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const handleRemoveClick = (
    event: MouseEvent<HTMLDivElement>,
    moduleKey: string
  ) => {
    event.stopPropagation()
    removeItemFromTimetable(moduleKey)
    posthog.capture("module_removed", {
      module_code: moduleKey,
      source: "timetable_sidebar"
    })
  }

  return (
    <div className="flex size-full flex-col space-y-4">
      <TimetableModeSelector />

      {/* Module search — always shown */}
      <div className="relative z-2 h-10 w-full rounded-lg">
        <div className="absolute top-0 left-0 w-full">
          <TimetableModulesSelect />
        </div>
      </div>

      {/* Module list — always shown */}
      <div className={cn("rounded-lg border-2", activeKey && "rounded-b-none")}>
        <div className="text-muted-foreground p-2 text-center text-xs">
          Registered Modules
        </div>

        <hr />

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

        {Object.entries(timetable).length === 0 && (
          <>
            <div className="p-2">
              <div className="text-muted-foreground text-center text-sm">
                You have not added modules
                <br /> Click on the search bar above to add modules
              </div>
            </div>
          </>
        )}
      </div>

      <hr />

      {/* Custom courses — always shown */}
      <CustomCourseEditor />

      {/* Mode-specific panels */}
      <Suspense fallback={null}>
        {mode === "generation" && <TimetableGenerationConfig />}
        {mode === "ai" && <TimetableAiChat />}
      </Suspense>
    </div>
  )
}

export default TimetableModifier
