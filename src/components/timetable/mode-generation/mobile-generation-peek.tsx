"use client"

import { useState } from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SaveIcon,
  Settings2Icon,
  WandIcon
} from "lucide-react"
import posthog from "posthog-js"

import { useTimetable } from "@/hooks/use-timetable"
import { useTimetableGeneration } from "@/hooks/use-timetable-generation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

import {
  ElevatedDialogContent,
  SettingsForm
} from "./timetable-generation-config"

interface Props {
  onExpand: () => void
}

const MobileGenerationPeek = ({ onExpand }: Props) => {
  const [open, setOpen] = useState(false)
  const { timetable } = useTimetable()
  const {
    combinations,
    currentIdx,
    isGenerating,
    hasGenerated,
    truncated,
    generate,
    navigateTo,
    saveToPlan
  } = useTimetableGeneration()

  const noModules = Object.keys(timetable).length === 0
  const hasResults = combinations.length > 0
  const noResults = hasGenerated && combinations.length === 0 && !isGenerating
  const current = combinations[currentIdx]

  return (
    <div className="flex h-[59px] shrink-0 items-center gap-2 px-3">
      {/* Settings */}
      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0"
        onClick={() => setOpen(true)}
        aria-label="Generation settings">
        <Settings2Icon className="size-4" />
      </Button>

      {/* Generate */}
      <Button
        className="h-9 flex-1 gap-1.5 text-xs"
        disabled={noModules || isGenerating}
        title={noModules ? "Add modules first" : undefined}
        onClick={() => {
          generate()
          posthog.capture("timetable_generation_started", {
            module_count: Object.keys(timetable).length
          })
        }}>
        <WandIcon className="size-3.5" />
        {isGenerating ? "Generating…" : "Generate"}
      </Button>

      {/* No results hint */}
      {noResults && (
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-muted-foreground text-xs">No results</span>
          <button
            className="text-muted-foreground text-xs underline"
            onClick={onExpand}>
            relax ↑
          </button>
        </div>
      )}

      {/* Result nav */}
      {hasResults && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            disabled={currentIdx === 0}
            aria-label="Previous combination"
            onClick={() => {
              navigateTo(currentIdx - 1)
              posthog.capture("generation_result_navigated", {
                direction: "prev",
                from_index: currentIdx + 1,
                to_index: currentIdx,
                total_results: combinations.length
              })
            }}>
            <ChevronLeftIcon className="size-4" />
          </Button>

          <span className="text-muted-foreground shrink-0 text-xs">
            {currentIdx + 1}/{combinations.length}
            {truncated ? "*" : ""}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            disabled={currentIdx === combinations.length - 1}
            aria-label="Next combination"
            onClick={() => {
              navigateTo(currentIdx + 1)
              posthog.capture("generation_result_navigated", {
                direction: "next",
                from_index: currentIdx + 1,
                to_index: currentIdx + 2,
                total_results: combinations.length
              })
            }}>
            <ChevronRightIcon className="size-4" />
          </Button>

          {/* Save */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-9 shrink-0"
                aria-label="Save to plan">
                <SaveIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {[0, 1, 2, 3, 4].map((i) => (
                <DropdownMenuItem
                  key={i}
                  onClick={() => {
                    saveToPlan(i)
                    posthog.capture("timetable_generation_result_saved", {
                      plan_index: i + 1,
                      free_days: current?.freeDays,
                      days_with_class: current?.daysWithClass,
                      result_index: currentIdx + 1,
                      total_results: combinations.length
                    })
                  }}>
                  Save to Plan {i + 1}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      {/* Settings dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <ElevatedDialogContent
          className="max-h-[calc(100dvh-2rem)] w-full overflow-y-auto sm:max-h-[85vh] sm:max-w-lg"
          aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Generation Settings</DialogTitle>
          </DialogHeader>
          <SettingsForm />
        </ElevatedDialogContent>
      </Dialog>
    </div>
  )
}

export default MobileGenerationPeek
