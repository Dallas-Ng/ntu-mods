"use client"

import { lazy, Suspense, useState, type MouseEvent } from "react"
import { useBoundState } from "@/state/bound.state"
import { TrashIcon } from "lucide-react"
import posthog from "posthog-js"

import { cn } from "@/lib/utils"
import { useTimetable } from "@/hooks/use-timetable"

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

                    <div
                      className="flex size-10 cursor-pointer items-center justify-center p-1"
                      onClick={(e) => handleRemoveClick(e, moduleKey)}>
                      <TrashIcon className="text-muted-foreground hover:text-foreground size-4 transition-colors" />
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
