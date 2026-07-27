"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound.state"
import { Copy } from "lucide-react"
import posthog from "posthog-js"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { useCustomCourses } from "@/hooks/use-custom-courses"
import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger
} from "@/components/ui/drawer"
import ButtonCollapsable from "@/components/button-collapsable"

const TimetableCopyButton = () => {
  const { timetables, updateTimetable, qsTimetable, updateTimetableIndex } =
    useTimetable()
  const { qsCustomCourses } = useCustomCourses()
  const setCustomCourses = useBoundState((s) => s.setCustomCourses)
  const { isMobile } = useSettings()
  const [open, setOpen] = useState(false)
  const [overrideIndex, setOverrideIndex] = useState<number | null>(null)

  const handleOverride = (overrideIndex: number) => {
    if (qsTimetable) {
      updateTimetable(qsTimetable, overrideIndex)
      // The plan is being overridden wholesale, so custom blocks follow the
      // shared link — including when it carries none.
      setCustomCourses(qsCustomCourses ?? [], overrideIndex)
      updateTimetableIndex(overrideIndex)
      posthog.capture("timetable_copied", {
        target_plan: overrideIndex + 1,
        module_count: Object.keys(qsTimetable).length,
        custom_block_count: qsCustomCourses?.length ?? 0
      })
      window.location.assign("/timetable")
      toast.success("Successfully copied timetable")
    }

    setOpen(false)
  }

  const handleClose = () => {
    setOverrideIndex(null)
    setOpen(false)
  }

  const trigger = <ButtonCollapsable icon={Copy} text="Copy Timetable" />

  const Content = (
    <>
      <p className="p-2 text-center text-sm text-rose-800">
        You will override your existing data
      </p>
      <div className="overflow-y-auto">
        <div className="space-y-1">
          {timetables.map((timetable, timetableIdx) => (
            <div
              key={timetableIdx}
              onClick={() => setOverrideIndex(timetableIdx)}
              className={cn(
                "hover:bg-accent rounded-md p-2 transition-colors hover:cursor-pointer",
                overrideIndex === timetableIdx && "bg-muted"
              )}>
              <p>Plan {timetableIdx + 1}</p>

              <div className="text-muted-foreground mt-2 text-xs">
                <div className="flex flex-wrap gap-1">
                  {Object.keys(timetable).map((moduleKey) => (
                    <div
                      key={moduleKey}
                      className="border-muted-foreground rounded-full border px-2 py-0">
                      {moduleKey}
                    </div>
                  ))}
                </div>

                {Object.entries(timetable).length === 0 && (
                  <p>No Modules Added</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  const Footer = (
    <div className="h-10 w-full">
      <div className="flex w-full justify-between">
        <Button variant="outline" onClick={handleClose}>
          Close
        </Button>

        {overrideIndex !== null && (
          <Button
            variant="destructive"
            onClick={() => handleOverride(overrideIndex)}>
            Override Plan {overrideIndex + 1}
          </Button>
        )}
      </div>
    </div>
  )

  if (isMobile)
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <div>{trigger}</div>
        </DrawerTrigger>

        <DrawerContent className="h-[80vh] p-2">
          <DrawerHeader className="p-2">Copy to Timetable</DrawerHeader>
          {Content}

          <DrawerFooter className="border-t p-0 pt-2">{Footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>{trigger}</div>
      </DialogTrigger>

      <DialogContent className="p-2" aria-describedby={undefined}>
        <DialogHeader className="p-2 pb-0">Copy to Timetable</DialogHeader>

        {Content}

        <DialogFooter className="border-t pt-2.5">{Footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TimetableCopyButton
