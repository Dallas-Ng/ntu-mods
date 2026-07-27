"use client"

import { useMemo, useState } from "react"
import posthog from "posthog-js"
import { toast } from "sonner"

import { decodeTextBundle } from "@/lib/timetable-share"
import { cn } from "@/lib/utils"
import { useBoundState } from "@/state/bound.state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TimetableImportDialog = ({ open, onOpenChange }: Props) => {
  const timetables = useBoundState((s) => s.timetables)
  const timetableIndex = useBoundState((s) => s.timetableIndex)
  const updateTimetable = useBoundState((s) => s.updateTimetable)
  const setCustomCourses = useBoundState((s) => s.setCustomCourses)
  const updateTimetableIndex = useBoundState((s) => s.updateTimetableIndex)

  const [value, setValue] = useState("")
  const [targetPlan, setTargetPlan] = useState(timetableIndex)

  const decoded = useMemo(
    () => (value.trim() ? decodeTextBundle(value) : undefined),
    [value]
  )

  const isInvalid = value.trim().length > 0 && !decoded

  const handleImport = () => {
    if (!decoded) return

    updateTimetable(decoded.timetable, targetPlan)
    setCustomCourses(decoded.customCourses, targetPlan)
    updateTimetableIndex(targetPlan)

    posthog.capture("timetable_imported", {
      target_plan: targetPlan + 1,
      module_count: Object.keys(decoded.timetable).length,
      custom_block_count: decoded.customCourses.length
    })

    toast.success(`Imported into Plan ${targetPlan + 1}`)
    setValue("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import timetable</DialogTitle>
          <DialogDescription>
            Paste a timetable code (starts with NTUMODS1-) or a share link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={5}
            placeholder="NTUMODS1-…"
            className={cn(
              "border-input bg-background w-full resize-none rounded-md border p-2 font-mono text-xs break-all outline-none",
              isInvalid && "border-destructive"
            )}
          />

          {isInvalid && (
            <p className="text-destructive text-xs">
              That doesn&apos;t look like a timetable code or share link.
            </p>
          )}

          {decoded && (
            <p className="text-muted-foreground text-xs">
              Found {Object.keys(decoded.timetable).length} module
              {Object.keys(decoded.timetable).length !== 1 ? "s" : ""} and{" "}
              {decoded.customCourses.length} custom block
              {decoded.customCourses.length !== 1 ? "s" : ""}.
            </p>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium">Import into</p>
            <div className="flex flex-wrap gap-1.5">
              {timetables.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTargetPlan(i)}
                  className={cn(
                    "h-7 cursor-pointer rounded-md border px-2.5 text-xs font-medium transition-colors",
                    targetPlan === i
                      ? "bg-foreground text-background border-transparent"
                      : "text-muted-foreground hover:border-foreground"
                  )}>
                  Plan {i + 1}
                </button>
              ))}
            </div>
            <p className="text-xs text-rose-600">
              Plan {targetPlan + 1} will be overwritten.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!decoded} onClick={handleImport}>
              Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TimetableImportDialog
