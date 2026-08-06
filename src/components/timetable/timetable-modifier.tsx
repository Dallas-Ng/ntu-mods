"use client"

import { lazy, Suspense, useEffect, useState, type MouseEvent } from "react"
import { useBoundState } from "@/state/bound.state"
import { StickyNote, TrashIcon } from "lucide-react"
import posthog from "posthog-js"

import { cn } from "@/lib/utils"
import { useTimetable } from "@/hooks/use-timetable"

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Textarea } from "../ui/textarea"
import CustomCourseEditor from "./custom-course-editor"
import TimetableIndexModifier from "./timetable-index-modifier"
import TimetableModeSelector from "./timetable-mode-selector"
import TimetableModulesSelect from "./timetable-modules-select"

interface ModuleRemarkPopoverProps {
  moduleKey: string
  indexKey: string
}

const ModuleRemarkPopover = ({
  moduleKey,
  indexKey
}: ModuleRemarkPopoverProps) => {
  const moduleRemark = useBoundState((s) => s.moduleRemarks[moduleKey] ?? "")
  const indexRemark = useBoundState(
    (s) => s.indexRemarks[`${moduleKey}:${indexKey}`] ?? ""
  )
  const setModuleRemark = useBoundState((s) => s.setModuleRemark)
  const setIndexRemark = useBoundState((s) => s.setIndexRemark)

  const [moduleDraft, setModuleDraft] = useState(moduleRemark)
  const [indexDraft, setIndexDraft] = useState(indexRemark)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setModuleDraft(moduleRemark)
      setIndexDraft(indexRemark)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      if (moduleDraft !== moduleRemark) {
        setModuleRemark(moduleKey, moduleDraft)
        posthog.capture("module_remark_updated", { module_code: moduleKey })
      }
      if (indexDraft !== indexRemark) {
        setIndexRemark(moduleKey, indexKey, indexDraft)
        posthog.capture("index_remark_updated", {
          module_code: moduleKey,
          index_key: indexKey
        })
      }
    }
  }

  const hasRemark = moduleRemark !== "" || indexRemark !== ""

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center p-1">
          <StickyNote
            className={cn(
              "size-4 transition-colors",
              hasRemark
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        onClick={(e) => e.stopPropagation()}
        className="w-72 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Module remarks</p>
          <p className="text-muted-foreground text-xs">
            Your own notes for {moduleKey}, shown on every block for this
            module.
          </p>
          <Textarea
            value={moduleDraft}
            onChange={(e) => setModuleDraft(e.target.value)}
            maxLength={200}
            placeholder="e.g. bring laptop, group project"
            className="min-h-16 text-sm"
          />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Index remarks</p>
          <p className="text-muted-foreground text-xs">
            Only shown for index {indexKey}.
          </p>
          <Textarea
            value={indexDraft}
            onChange={(e) => setIndexDraft(e.target.value)}
            maxLength={200}
            placeholder="e.g. seat near the door"
            className="min-h-16 text-sm"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Only rendered once the user switches mode — kept out of the initial
// bundle since generation config + AI chat pull in ~800+ lines and their
// own deps that the default "Calendar" mode never touches.
const TimetableAiChat = lazy(() => import("./mode-ai/timetable-ai-chat"))
const TimetableGenerationConfig = lazy(
  () => import("./mode-generation/timetable-generation-config")
)

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

        <div className="max-h-[40vh] overflow-y-auto">
          {Object.entries(timetable).map(([moduleKey, indexKey]) => {
            const isActive = activeKey === moduleKey

            return (
              <TimetableIndexModifier
                key={moduleKey}
                moduleKey={moduleKey}
                open={isActive}
                onOpenChange={(moduleKey) => setActiveKey(moduleKey)}>
                <div
                  className={cn(
                    "hover:bg-accent cursor-pointer pr-1 pl-4 text-sm transition-colors",
                    isActive && "bg-muted rounded-b-none"
                  )}>
                  <div className="flex w-full items-center justify-between">
                    <div className="flex gap-1">
                      <div className="w-15">{moduleKey}</div>
                      <div className="text-muted-foreground text-sm">
                        {indexKey}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <ModuleRemarkPopover
                        moduleKey={moduleKey}
                        indexKey={indexKey}
                      />

                      <div
                        className="flex size-10 cursor-pointer items-center justify-center p-1"
                        onClick={(e) => handleRemoveClick(e, moduleKey)}>
                        <TrashIcon className="text-muted-foreground hover:text-foreground size-4 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </TimetableIndexModifier>
            )
          })}
        </div>

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
