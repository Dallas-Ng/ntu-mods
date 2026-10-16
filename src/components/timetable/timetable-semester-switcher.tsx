"use client"

import { useBoundState } from "@/state/bound.state"
import posthog from "posthog-js"

import { SELECTABLE_SEMESTERS, semesterLabelShort } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useSelectedSemester } from "@/hooks/use-selected-semester"

/**
 * One-tap switch between the two semesters you can plan in. Plans, locks and
 * notes are kept per semester, so switching never mixes them up.
 */
const TimetableSemesterSwitcher = () => {
  const { key: selected } = useSelectedSemester()
  const switchSemester = useBoundState((s) => s.switchSemester)

  if (SELECTABLE_SEMESTERS.length < 2) return null

  // Older semester on the left, so time reads left to right
  const options = [...SELECTABLE_SEMESTERS].reverse()

  return (
    <div
      role="group"
      aria-label="Semester"
      className="bg-muted inline-flex rounded-md p-0.5">
      {options.map((semester) => (
        <button
          key={semester}
          type="button"
          aria-pressed={semester === selected}
          onClick={() => {
            if (semester === selected) return
            posthog.capture("timetable_semester_switched", {
              from_semester: selected,
              to_semester: semester
            })
            switchSemester(semester)
          }}
          className={cn(
            "h-8 cursor-pointer rounded-[5px] px-3 text-xs font-medium whitespace-nowrap transition-colors",
            semester === selected
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}>
          {semesterLabelShort(semester)}
        </button>
      ))}
    </div>
  )
}

export default TimetableSemesterSwitcher
