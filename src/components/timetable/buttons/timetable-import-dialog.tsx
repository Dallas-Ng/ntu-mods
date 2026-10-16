"use client"

import { useMemo, useState } from "react"
import { useBoundState } from "@/state/bound.state"
import posthog from "posthog-js"
import { toast } from "sonner"

import { bestMatchSemester } from "@/lib/semester-match"
import {
  isSelectableSemester,
  resolveSemester,
  SELECTABLE_SEMESTERS,
  semesterLabel
} from "@/lib/semesters"
import { decodeTextBundle } from "@/lib/timetable-share"
import { cn } from "@/lib/utils"
import { fetchSeasonIndexes } from "@/hooks/use-season-indexes"
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
  const activeTimetables = useBoundState((s) => s.timetables)
  const semesterWorkspaces = useBoundState((s) => s.semesterWorkspaces)
  const storedSemester = useBoundState((s) => s.semester)
  const switchSemester = useBoundState((s) => s.switchSemester)
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

  const activeSemester = resolveSemester(storedSemester)
  const unavailableSemester =
    decoded?.semester && !isSelectableSemester(decoded.semester)
      ? decoded.semester
      : undefined
  // Plans that would be overwritten: the ones in the semester being imported to.
  const importSemester = decoded?.semester ?? activeSemester
  const timetables =
    importSemester === activeSemester || unavailableSemester
      ? activeTimetables
      : (semesterWorkspaces[importSemester]?.timetables ??
        activeTimetables.map(() => ({})))

  const handleImport = async () => {
    if (!decoded || unavailableSemester) return

    // Old codes carry no semester; place them by which semester's indexes fit.
    let semester = decoded.semester
    if (!semester) {
      const entries = await Promise.all(
        SELECTABLE_SEMESTERS.map(async (sem) => {
          const [year, term] = sem.split(";")
          return [sem, await fetchSeasonIndexes(year, term)] as const
        })
      )
      semester = bestMatchSemester(
        [decoded.timetable],
        Object.fromEntries(entries),
        SELECTABLE_SEMESTERS
      )
    }
    if (semester !== activeSemester) switchSemester(semester)

    updateTimetable(decoded.timetable, targetPlan)
    setCustomCourses(decoded.customCourses, targetPlan)
    updateTimetableIndex(targetPlan)

    posthog.capture("timetable_imported", {
      target_plan: targetPlan + 1,
      module_count: Object.keys(decoded.timetable).length,
      custom_block_count: decoded.customCourses.length
    })

    toast.success(
      `Imported into Plan ${targetPlan + 1} (${semesterLabel(semester)})`
    )
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

          {unavailableSemester && (
            <p className="text-destructive text-xs">
              This timetable is for {semesterLabel(unavailableSemester)}, which
              can no longer be planned in.
            </p>
          )}

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
              {decoded.customCourses.length !== 1 ? "s" : ""}
              {decoded.semester
                ? ` for ${semesterLabel(decoded.semester)}`
                : ""}
              .
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
            <p className="text-destructive text-xs">
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
            <Button
              size="sm"
              disabled={!decoded || Boolean(unavailableSemester)}
              onClick={handleImport}>
              Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TimetableImportDialog
