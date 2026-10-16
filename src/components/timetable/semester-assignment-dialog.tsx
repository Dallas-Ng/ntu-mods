"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound.state"
import posthog from "posthog-js"

import { bestMatchSemester } from "@/lib/semester-match"
import {
  SELECTABLE_SEMESTERS,
  semesterLabel,
  splitSemester
} from "@/lib/semesters"
import { fetchSeasonIndexes } from "@/hooks/use-season-indexes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

/**
 * Shown once to people who already had a timetable before plans became
 * per-semester. Their saved data has no semester, and index numbers mean
 * different slots in different semesters, so ask rather than guess wrong.
 */
const SemesterAssignmentDialog = () => {
  const pending = useBoundState((s) => s.pendingSemesterAssignment)
  const timetables = useBoundState((s) => s.timetables)
  const assignSemester = useBoundState((s) => s.assignSemester)
  const clearAllWorkspaces = useBoundState((s) => s.clearAllWorkspaces)
  const [busy, setBusy] = useState(false)

  const handleKeep = async () => {
    setBusy(true)
    const entries = await Promise.all(
      SELECTABLE_SEMESTERS.map(async (semester) => {
        const [year, term] = splitSemester(semester)
        return [semester, await fetchSeasonIndexes(year, term)] as const
      })
    )
    const semester = bestMatchSemester(
      timetables,
      Object.fromEntries(entries),
      SELECTABLE_SEMESTERS
    )
    posthog.capture("semester_assignment_kept", { semester })
    assignSemester(semester)
    setBusy(false)
  }

  const handleClear = () => {
    posthog.capture("semester_assignment_cleared")
    clearAllWorkspaces()
  }

  return (
    <Dialog open={pending}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your timetable now belongs to a semester</DialogTitle>
          <DialogDescription>
            You can now plan{" "}
            {SELECTABLE_SEMESTERS.map(semesterLabel).join(" and ")}, each with
            its own plans, locked modules and notes. Index numbers change
            between semesters, so we need to know which one your saved timetable
            is for.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Button
            size="lg"
            className="h-14 text-base"
            disabled={busy}
            onClick={handleKeep}>
            Keep my timetable
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 text-base"
            disabled={busy}
            onClick={handleClear}>
            Clear everything
          </Button>
        </div>

        <p className="text-muted-foreground text-xs">
          <strong>Keep</strong> moves your plans, custom blocks, locks and notes
          to the semester they best match. <strong>Clear</strong> deletes all of
          them so you can start fresh.
        </p>
      </DialogContent>
    </Dialog>
  )
}

export default SemesterAssignmentDialog
