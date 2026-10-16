"use client"

import { useBoundState } from "@/state/bound.state"
import posthog from "posthog-js"

import {
  SELECTABLE_SEMESTERS,
  semesterLabel,
  semesterLabelCompact
} from "@/lib/semesters"
import { usePathname } from "@/hooks/use-pathname"
import { pushSearchParams, useSearchParams } from "@/hooks/use-search-params"
import { useSelectedSemester } from "@/hooks/use-selected-semester"
import SemesterPills from "@/components/semester-pills"

const ALL = "all"

/**
 * Same pills as the planner. Picking a semester switches the planner's
 * semester too, so "Add to calendar" on this page always adds to the plan you
 * are looking at; "All" is the only state kept in the URL.
 */
export const ModsSemesterPills = ({
  allSemesters
}: {
  allSemesters: boolean
}) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { key: selectedSemester } = useSelectedSemester()
  const switchSemester = useBoundState((s) => s.switchSemester)

  const handleChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString())
    // Drop the legacy flag along with the new one
    params.delete("currentOnly")
    if (next === ALL) {
      params.set("sem", ALL)
    } else {
      params.delete("sem")
      switchSemester(next)
    }
    pushSearchParams(pathname, params.toString())
    posthog.capture("mods_filter_applied", {
      filter_type: "semester",
      value: next
    })
  }

  return (
    <SemesterPills
      options={[
        ...[...SELECTABLE_SEMESTERS].reverse().map((semester) => ({
          value: semester,
          label: semesterLabelCompact(semester),
          title: semesterLabel(semester)
        })),
        { value: ALL, label: "All", title: "All semesters" }
      ]}
      value={allSemesters ? ALL : selectedSemester}
      onChange={handleChange}
    />
  )
}
