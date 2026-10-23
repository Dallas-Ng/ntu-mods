"use client"

import { useMemo, useState } from "react"
import { useBoundState } from "@/state/bound.state"
import { toast } from "sonner"

import { track } from "@/lib/analytics"
import { planHasData } from "@/lib/plan-name"
import { decodeTextBundle } from "@/lib/timetable-share"
import { cn } from "@/lib/utils"
import { usePlanNames } from "@/hooks/use-plan-names"
import { Button } from "@/components/ui/button"
import {
  ModalFooter,
  ModalNote,
  ModalSection
} from "@/components/ui/modal-parts"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TimetableImportDialog = ({ open, onOpenChange }: Props) => {
  const timetables = useBoundState((s) => s.timetables)
  const customCourses = useBoundState((s) => s.customCourses)
  const { label } = usePlanNames()
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

    track("timetable_imported", {
      target_plan: targetPlan + 1,
      module_count: Object.keys(decoded.timetable).length,
      custom_block_count: decoded.customCourses.length
    })

    toast.success(`Imported into ${label(targetPlan)}`)
    setValue("")
    onOpenChange(false)
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      nested={false}
      title="Import timetable"
      showDescription
      description="Paste a timetable code (starts with NTUMODS1-) or a share link."
      className="max-h-[90vh] overflow-y-auto sm:max-w-md">
      <div className="space-y-5">
        <ModalSection title="Timetable code">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            placeholder="NTUMODS1-…"
            aria-invalid={isInvalid}
            className="resize-none font-mono text-xs break-all md:text-xs"
          />
          {isInvalid && (
            <ModalNote tone="danger">
              That doesn&apos;t look like a timetable code or share link.
            </ModalNote>
          )}
          {decoded && (
            <ModalNote>
              Found {Object.keys(decoded.timetable).length} module
              {Object.keys(decoded.timetable).length !== 1 ? "s" : ""} and{" "}
              {decoded.customCourses.length} custom block
              {decoded.customCourses.length !== 1 ? "s" : ""}.
            </ModalNote>
          )}
        </ModalSection>

        <ModalSection title="Import into">
          <div className="flex flex-wrap gap-1.5">
            {timetables.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTargetPlan(i)}
                aria-pressed={targetPlan === i}
                className={cn(
                  "bg-muted h-8 max-w-full cursor-pointer truncate rounded-md px-3 text-sm transition-colors",
                  targetPlan === i
                    ? "bg-foreground text-background border-transparent"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}>
                {label(i)}
              </button>
            ))}
          </div>
          {planHasData(timetables, customCourses, targetPlan) && (
            <ModalNote tone="danger">
              {label(targetPlan)} already has a timetable. Importing will
              overwrite it.
            </ModalNote>
          )}
        </ModalSection>

        <ModalFooter>
          <Button
            variant="outline"
            className="hidden sm:inline-flex"
            onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!decoded} onClick={handleImport}>
            Import
          </Button>
        </ModalFooter>
      </div>
    </ResponsiveModal>
  )
}

export default TimetableImportDialog
