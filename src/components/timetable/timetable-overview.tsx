"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { latestSemester, latestYear } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useAllModules } from "@/hooks/use-all-modules"
import { useTimetable } from "@/hooks/use-timetable"

const TimetableOverview = () => {
  const { timetable } = useTimetable()
  const year = latestYear
  const semester = latestSemester
  const { modules } = useAllModules()
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
    modules
      .filter((m) => timetable[m.code])
      .map((m) => [m.code, { title: m.title, au: m.au }])
  )

  return (
    <div className="">
      <table className="table w-full table-fixed text-center text-xs">
        <thead>
          <tr className="border-b">
            <th className="w-fit lg:w-25">Index</th>
            <th className="w-fit lg:w-25">Module</th>
            <th className="hidden text-left lg:table-cell">Title</th>
            <th className="w-fit">AU</th>
            <th className="w-fit lg:w-55">Exam</th>
          </tr>
        </thead>

        <tbody>
          {Object.entries(timetable).map(([moduleKey, indexKey], moduleIdx) => {
            const meta = moduleMetaMap[moduleKey]
            const moduleTitle = meta?.title ?? ""
            const au = meta?.au ?? "0"
            const exam = examMap[moduleKey]
            const examDisplay = exam
              ? `${exam.date}, ${exam.start_time} - ${exam.end_time}`
              : ""

            return (
              <tr
                key={moduleIdx}
                className={cn(moduleIdx % 2 == 1 && "bg-muted")}>
                <td className="w-fit lg:w-25">{indexKey}</td>

                <td className="w-fit lg:w-25">
                  <Link
                    href={`/mods/${moduleKey}`}
                    className="hover:text-primary-alt transition-colors">
                    {moduleKey}
                  </Link>
                </td>

                <td className="hidden text-left lg:table-cell">
                  <Link
                    href={`/mods/${moduleKey}`}
                    className="hover:text-primary-alt transition-colors">
                    {moduleTitle}
                  </Link>
                </td>

                <td>{au}</td>
                <td className="text-left">{examDisplay}</td>
              </tr>
            )
          })}

          <tr className="border-t">
            <td></td>
            <td></td>
            <td className="hidden lg:table-cell"></td>
            <td>
              {Object.keys(timetable)
                .reduce((acc, moduleKey) => {
                  const au =
                    parseFloat(moduleMetaMap[moduleKey]?.au ?? "0") || 0
                  return acc + au
                }, 0)
                .toFixed(1)}{" "}
              AUs
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <p className="text-muted-foreground mt-3 text-xs">
        The Exam information shown may be subject to changes. Students are to
        check the finalised exam timetable with exam seat information, which
        will be available at the &apos;Examination Seating Arrangement&apos;
        webpage, 2 weeks before start of examination.
      </p>
    </div>
  )
}

export default TimetableOverview
