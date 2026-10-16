"use client"

import { useMemo, useState } from "react"
import { useBoundState } from "@/state/bound.state"
import { Info, TriangleAlert, X } from "lucide-react"
import posthog from "posthog-js"

import { hasWeek1Start, week1Start } from "@/config/semester-calendar"
import { customCoursesToIndexMap } from "@/lib/custom-course-to-index"
import { resolveBestIndex } from "@/lib/resolve-best-index"
import { modulesNotOffered } from "@/lib/semester-match"
import {
  DEFAULT_SEMESTER,
  SELECTABLE_SEMESTERS,
  semesterLabel,
  semesterLabelShort
} from "@/lib/semesters"
import { useCustomCourses } from "@/hooks/use-custom-courses"
import { useHydrated } from "@/hooks/use-hydrated"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useSelectedSemester } from "@/hooks/use-selected-semester"
import { useTimetable } from "@/hooks/use-timetable"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

const DISMISSED_KEY = "ntu-mods-provisional-dismissed"

const readDismissed = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]")
  } catch {
    return []
  }
}

/** localStorage does not exist while rendering on the server. */
const readDismissedSafe = () =>
  typeof localStorage === "undefined" ? [] : readDismissed()

const hasStarted = (semester: string) =>
  !hasWeek1Start(semester) || new Date(week1Start(semester)) <= new Date()

/** Banners that keep the semester choice honest. Rendered above the planner. */
const TimetableSemesterNotices = () => {
  const hydrated = useHydrated()
  const [dismissed, setDismissed] = useState<string[]>(readDismissedSafe)
  const { key, year, semester, label } = useSelectedSemester()
  const { stateTimetable: timetable, timetableIndex } = useTimetable()
  const { customCourses } = useCustomCourses()
  const { indexes: seasonIndexes, isLoading } = useSeasonIndexes(year, semester)

  const pendingAssignment = useBoundState((s) => s.pendingSemesterAssignment)
  const chosenAgainst = useBoundState((s) => s.semesterChosenAgainst)
  const workspaces = useBoundState((s) => s.semesterWorkspaces)
  const switchSemester = useBoundState((s) => s.switchSemester)
  const addItemToTimetable = useBoundState((s) => s.addItemToTimetable)
  const removeItemFromTimetable = useBoundState(
    (s) => s.removeItemFromTimetable
  )
  const toggleModuleLock = useBoundState((s) => s.toggleModuleLock)
  const lockedModules = useBoundState((s) => s.lockedModules)
  const setModuleRemark = useBoundState((s) => s.setModuleRemark)

  const loaded = !isLoading && Object.keys(seasonIndexes).length > 0

  const notOffered = useMemo(
    () => (loaded ? modulesNotOffered(timetable, seasonIndexes) : []),
    [loaded, timetable, seasonIndexes]
  )

  // The other selectable semester's plan, offered as a starting point
  const otherSemester = SELECTABLE_SEMESTERS.find((s) => s !== key)
  const otherWorkspace = otherSemester ? workspaces[otherSemester] : undefined
  const otherModules = otherWorkspace
    ? Object.keys(
        otherWorkspace.timetables[otherWorkspace.timetableIndex] ?? {}
      )
    : []
  const offeredFromOther = loaded
    ? otherModules.filter((code) => code in seasonIndexes)
    : []
  const canCopy =
    loaded && Object.keys(timetable).length === 0 && offeredFromOther.length > 0

  const handleCopy = () => {
    if (!otherWorkspace) return
    const source =
      otherWorkspace.timetables[otherWorkspace.timetableIndex] ?? {}
    const blocked = customCoursesToIndexMap(customCourses)
    const added: Timetable = {}
    // Index numbers differ per semester, so only the modules carry over; each
    // gets the least clashing index, like adding it by hand.
    for (const code of offeredFromOther) {
      const indexKey = resolveBestIndex(
        seasonIndexes[code],
        added,
        seasonIndexes,
        Object.values(blocked).flat()
      )
      added[code] = indexKey
      addItemToTimetable(code, indexKey)
      if (otherWorkspace.lockedModules.includes(code)) {
        if (!lockedModules.includes(code)) toggleModuleLock(code)
      }
      const remark = otherWorkspace.moduleRemarks[code]
      if (remark) setModuleRemark(code, remark)
    }
    posthog.capture("timetable_modules_copied_from_semester", {
      from_semester: otherSemester,
      to_semester: key,
      module_count: offeredFromOther.length,
      plan: timetableIndex + 1
    })
  }

  const showNewer =
    chosenAgainst !== null &&
    chosenAgainst !== DEFAULT_SEMESTER &&
    key !== DEFAULT_SEMESTER
  const showProvisional = !hasStarted(key) && !dismissed.includes(key)

  const dismissProvisional = () => {
    const next = [...readDismissed(), key]
    setDismissed(next)
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
    } catch {
      // storage unavailable: it just comes back next visit
    }
  }

  // Until the keep-or-clear dialog is answered the saved plan has no semester,
  // so warning that its modules are "not offered" would be noise.
  // Notices depend on saved state the server never sees, so leave them out of
  // the first render to keep it identical to the server HTML.
  if (!hydrated || pendingAssignment) return null

  if (!showNewer && !showProvisional && notOffered.length === 0 && !canCopy) {
    return null
  }

  return (
    <div className="space-y-2">
      {showNewer && (
        <Alert>
          <Info />
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{semesterLabel(DEFAULT_SEMESTER)} is now available.</span>
            <Button size="xs" onClick={() => switchSemester(DEFAULT_SEMESTER)}>
              Switch to {semesterLabelShort(DEFAULT_SEMESTER)}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {showProvisional && (
        <Alert>
          <Info />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>
              {semesterLabelShort(key)} slots are provisional and can still
              change.
            </span>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Dismiss"
              onClick={dismissProvisional}>
              <X />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {notOffered.length > 0 && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>
              {notOffered.join(", ")}{" "}
              {notOffered.length === 1 ? "isn't" : "aren't"} offered in {label}{" "}
              and can&apos;t be shown.
            </span>
            <span className="flex gap-2">
              {otherSemester && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => switchSemester(otherSemester)}>
                  Switch to {semesterLabelShort(otherSemester)}
                </Button>
              )}
              <Button
                size="xs"
                variant="outline"
                onClick={() => notOffered.forEach(removeItemFromTimetable)}>
                Remove {notOffered.length === 1 ? "it" : "them"}
              </Button>
            </span>
          </AlertDescription>
        </Alert>
      )}

      {canCopy && otherSemester && (
        <Alert>
          <Info />
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>
              {offeredFromOther.length} of your{" "}
              {semesterLabelShort(otherSemester)} modules{" "}
              {offeredFromOther.length === 1 ? "is" : "are"} also offered in{" "}
              {semesterLabelShort(key)}.
            </span>
            <Button size="xs" onClick={handleCopy}>
              Start from my {semesterLabelShort(otherSemester)} modules
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default TimetableSemesterNotices
