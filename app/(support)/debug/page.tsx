"use client"

import { useEffect } from "react"
import { useBoundState } from "@/state/bound-state"

export default function DebugPage() {
  const { courses, coursesToIndex, resetCourses, resetCourseToIndex } =
    useBoundState()

  useEffect(() => {
    console.log(courses)
    console.log(coursesToIndex)

    resetCourses()
    resetCourseToIndex()
  }, [])

  return (
    <>
      <h1 className="bg-gradient-to-r from-emerald-500 to-emerald-900 bg-clip-text pl-4 pt-3 text-3xl font-bold text-transparent">
        Help
      </h1>
    </>
  )
}
