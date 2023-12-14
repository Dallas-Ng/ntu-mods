"use client"

import { useBoundState } from "@/state/bound-state"

import { DEF_SCROLLBAR, cn } from "@/lib/utils"

import { CourseCodeSelect } from "./course-code-select"
import StarsCourseBadge from "./stars-course-badge"
import StarsTable from "./stars-table"
import { Button } from "./ui/button"

// Easter Eggs
const EGG_LEVEL_1 = 8 // this is already a stretch? if max AU is 20 in a sem.
const EGG_LEVEL_2 = 13
const EGG_LEVEL_3 = 20
const EGG_LEVEL_4 = 30

export default function StarsPlanner() {
  const { courses, resetCourses } = useBoundState()

  const easterEggTriggered = courses.length > EGG_LEVEL_1

  return (
    <>
      <div
        className={cn(
          "relative flex w-full gap-2 overflow-auto px-2 py-4 md:gap-4 md:overflow-hidden",
          easterEggTriggered ? "items-start" : "items-center"
        )}>
        <div className="flex flex-col gap-1">
          <CourseCodeSelect />

          {easterEggTriggered && (
            <Button
              className="h-fit w-full max-w-[200px] p-2 text-sm"
              variant="secondary"
              onClick={resetCourses}>
              Click to clear courses
            </Button>
          )}
        </div>

        <div className="flex flex-col justify-center gap-2 overflow-x-auto">
          <div
            className={cn(
              "flex gap-2 overflow-x-auto md:flex-wrap",
              DEF_SCROLLBAR
            )}>
            {courses.map((c, i) => (
              <StarsCourseBadge key={i} courseKey={c.key}>
                {c.key}
              </StarsCourseBadge>
            ))}
          </div>

          {easterEggTriggered && (
            <span className="hidden w-full pr-5 text-right text-sm md:block">
              {courses.length > EGG_LEVEL_1 &&
                courses.length < EGG_LEVEL_2 &&
                "How many courses do you actually attend in a semester..."}

              {courses.length >= EGG_LEVEL_2 &&
                courses.length < EGG_LEVEL_3 &&
                "Really. Stop. You do not have this much courses."}

              {courses.length >= EGG_LEVEL_3 &&
                courses.length < EGG_LEVEL_4 &&
                "At this point, my website is just going to break."}

              {courses.length >= EGG_LEVEL_4 &&
                "You did it. You found this text. There is no more after this... or is there.."}
            </span>
          )}
        </div>
      </div>

      <StarsTable />
    </>
  )
}
