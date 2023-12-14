"use client"

import { useBoundState } from "@/state/bound-state"

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
      <div className="relative flex w-full items-start gap-2 overflow-auto px-2 py-4 md:gap-4 md:overflow-hidden lg:items-center">
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

        <div className="flex w-full flex-col justify-center gap-2 overflow-x-auto">
          <div className="flex gap-1 overflow-x-auto md:flex-wrap">
            {courses.map((c, i) => (
              <div className="flex h-[40px] items-center md:h-fit">
                <StarsCourseBadge key={i} courseKey={c.key}>
                  {c.key}
                </StarsCourseBadge>
              </div>
            ))}
          </div>

          {easterEggTriggered && (
            <span className="w-full text-right text-sm md:block md:pr-10 md:text-left">
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
