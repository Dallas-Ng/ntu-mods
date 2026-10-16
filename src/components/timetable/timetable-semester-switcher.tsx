"use client"

import { useBoundState } from "@/state/bound.state"
import posthog from "posthog-js"

import { SELECTABLE_SEMESTERS, semesterLabelShort } from "@/lib/semesters"
import { useSelectedSemester } from "@/hooks/use-selected-semester"
import SemesterPills from "@/components/semester-pills"

/**
 * One-tap switch between the two semesters you can plan in. Plans, locks and
 * notes are kept per semester, so switching never mixes them up.
 */
const TimetableSemesterSwitcher = () => {
  const { key: selected } = useSelectedSemester()
  const switchSemester = useBoundState((s) => s.switchSemester)

  if (SELECTABLE_SEMESTERS.length < 2) return null

  return (
    <SemesterPills
      // Older semester on the left, so time reads left to right
      options={[...SELECTABLE_SEMESTERS].reverse().map((semester) => ({
        value: semester,
        label: semesterLabelShort(semester)
      }))}
      value={selected}
      onChange={(semester) => {
        posthog.capture("timetable_semester_switched", {
          from_semester: selected,
          to_semester: semester
        })
        switchSemester(semester)
      }}
    />
  )
}

export default TimetableSemesterSwitcher
