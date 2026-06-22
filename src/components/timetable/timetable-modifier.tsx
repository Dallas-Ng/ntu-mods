"use client"

import { useEffect, useState } from "react"

import { latestSemester, latestYear } from "@/lib/semesters"
import { useAllModules } from "@/hooks/use-all-modules"
import { useTimetable } from "@/hooks/use-timetable"

import CustomCourseEditor from "./custom-course-editor"
import TimetableModuleCard from "./timetable-module-card"
import TimetableModulesSelect from "./timetable-modules-select"

const TimetableModifier = () => {
  const { timetable } = useTimetable()
  const { modules } = useAllModules()
  const year = latestYear
  const semester = latestSemester
  const [examMap, setExamMap] = useState<
    Record<string, { date: string; start_time: string; end_time: string }>
  >({})

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/data/api/exams/${year}_${semester}.json`, {
      signal: controller.signal
    })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => setExamMap(data ?? {}))
      .catch(() => setExamMap({}))
    return () => controller.abort()
  }, [year, semester])

  const moduleMetaMap = Object.fromEntries(
    modules.map((m) => [m.code, { title: m.title, au: m.au }])
  )

  const moduleCount = Object.keys(timetable).length

  return (
    <div className="flex size-full flex-col gap-3">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          Modules
          {moduleCount > 0 && (
            <span className="bg-primary text-primary-foreground ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs">
              {moduleCount}
            </span>
          )}
        </span>
      </div>

      {/* Module search */}
      <div className="relative z-10 w-full">
        <TimetableModulesSelect />
      </div>

      {/* Module list */}
      <div className="rounded-lg border">
        {moduleCount === 0 ? (
          <div className="text-muted-foreground p-4 text-center text-sm">
            No modules added
            <br />
            <span className="text-xs">Search above to add modules</span>
          </div>
        ) : (
          Object.keys(timetable).map((moduleKey) => {
            const meta = moduleMetaMap[moduleKey]
            const exam = examMap[moduleKey]
            return (
              <TimetableModuleCard
                key={moduleKey}
                moduleKey={moduleKey}
                title={meta?.title}
                au={meta?.au}
                examDate={exam?.date}
              />
            )
          })
        )}
      </div>

      <hr />

      <CustomCourseEditor />
    </div>
  )
}

export default TimetableModifier
