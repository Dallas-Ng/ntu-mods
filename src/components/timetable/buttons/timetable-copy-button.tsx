"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound.state"
import { Copy } from "lucide-react"
import { toast } from "sonner"

import { track } from "@/lib/analytics"
import { planHasData } from "@/lib/plan-name"
import { cn } from "@/lib/utils"
import { useCustomCourses } from "@/hooks/use-custom-courses"
import { usePlanNames } from "@/hooks/use-plan-names"
import { useTimetable } from "@/hooks/use-timetable"
import { Button } from "@/components/ui/button"
import {
  ModalFooter,
  ModalNote,
  ModalSection
} from "@/components/ui/modal-parts"
import { ResponsiveModal } from "@/components/ui/responsive-modal"

const TimetableCopyButton = () => {
  const { timetables, updateTimetable, qsTimetable, updateTimetableIndex } =
    useTimetable()
  const { qsCustomCourses } = useCustomCourses()
  const customCourses = useBoundState((s) => s.customCourses)
  const setCustomCourses = useBoundState((s) => s.setCustomCourses)
  const { label } = usePlanNames()
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState(0)

  const overwrites = planHasData(timetables, customCourses, target)

  const handleCopy = () => {
    if (!qsTimetable) return
    updateTimetable(qsTimetable, target)
    // The plan is replaced wholesale, so custom blocks follow the shared
    // link, including when it carries none.
    setCustomCourses(qsCustomCourses ?? [], target)
    updateTimetableIndex(target)
    track("timetable_copied", {
      target_plan: target + 1,
      module_count: Object.keys(qsTimetable).length,
      custom_block_count: qsCustomCourses?.length ?? 0
    })
    window.location.assign("/timetable")
    toast.success("Successfully copied timetable")
    setOpen(false)
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-10 w-full gap-2 sm:h-9 sm:w-auto">
        <Copy className="size-4" />
        Copy to my plans
      </Button>

      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        nested={false}
        title="Copy to my plans"
        showDescription
        description="Pick the plan to put this timetable in, then edit it as your own."
        className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <div className="space-y-5">
          <ModalSection title="Copy into">
            <div className="flex flex-wrap gap-1.5">
              {timetables.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTarget(i)}
                  aria-pressed={target === i}
                  className={cn(
                    "bg-muted h-8 max-w-full cursor-pointer truncate rounded-md px-3 text-sm transition-colors",
                    target === i
                      ? "bg-foreground text-background border-transparent"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}>
                  {label(i)}
                </button>
              ))}
            </div>
            {overwrites && (
              <ModalNote tone="danger">
                {label(target)} already has a timetable. Copying will overwrite
                it.
              </ModalNote>
            )}
          </ModalSection>

          <ModalFooter>
            <Button
              variant="outline"
              className="hidden sm:inline-flex"
              onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={overwrites ? "destructive" : "default"}
              onClick={handleCopy}>
              {overwrites ? "Overwrite and copy" : "Copy"}
            </Button>
          </ModalFooter>
        </div>
      </ResponsiveModal>
    </>
  )
}

export default TimetableCopyButton
