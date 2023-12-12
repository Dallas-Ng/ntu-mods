"use client"

import { useBoundState } from "@/state/bound-state"

import { CourseCodeSelect } from "./course-code-select"
import StarsCourseBadge from "./stars-course-badge"
import StarsTable from "./stars-table"

export default function StarsPlanner() {
  const { courses, coursesToIndex } = useBoundState()

  // const data = coursesToIndex.map((cToI) => {
  //   const course = courses.find((x) => x.key === cToI.courseKey)! // should always return course
  //   const index = course.indexes[cToI.indexKey]
  //   return { ...course, selectedIndex: index }
  // })

  // console.log(data)
  return (
    <>
      <div className="flex flex-row items-center gap-2 py-4 pl-2">
        <CourseCodeSelect />

        {courses.map((c, i) => (
          <StarsCourseBadge key={i} courseKey={c.key}>
            {c.key}
          </StarsCourseBadge>
        ))}
      </div>

      {/* <StarsTable courses={data || []} /> */}
    </>
  )
}
