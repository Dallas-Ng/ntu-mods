"use client"

import { useBoundState } from "@/state/bound.state"
import posthog from "posthog-js"

import {
  DEFAULT_SEMESTER,
  SELECTABLE_SEMESTERS,
  semesterLabelShort
} from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { usePathname } from "@/hooks/use-pathname"
import { pushSearchParams, useSearchParams } from "@/hooks/use-search-params"
import { useSelectedSemester } from "@/hooks/use-selected-semester"
import CustomSelect from "@/components/select"

const ALL = "all"

const SELECT_ITEMS = [
  ...SELECTABLE_SEMESTERS.map((semester) => ({
    value: semester,
    label:
      semesterLabelShort(semester) +
      (semester === DEFAULT_SEMESTER ? " (latest)" : "")
  })),
  { value: ALL, label: "All Semesters" }
]

/**
 * Picking a semester here switches the planner's semester too, so "Add to
 * calendar" on this page always adds to the plan you are looking at. "All
 * Semesters" is the only state kept in the URL.
 */
export const ModsSemesterSelect = ({
  allSemesters
}: {
  allSemesters: boolean
}) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { key: selectedSemester } = useSelectedSemester()
  const switchSemester = useBoundState((s) => s.switchSemester)

  const value = allSemesters ? ALL : selectedSemester

  const handleChange = (next: string | null) => {
    if (next === null || next === value) return

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
    <CustomSelect
      closeOnSelect
      value={value}
      selectItems={SELECT_ITEMS}
      onChange={handleChange}
      divClassName={cn("w-full", allSemesters && "ring-ring rounded-md ring-1")}
    />
  )
}
