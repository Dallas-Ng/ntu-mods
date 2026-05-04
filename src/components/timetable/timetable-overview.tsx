"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { useLatestSemester } from "@/hooks/use-latest-semester"
import { useTimetable } from "@/hooks/use-timetable"

const TimetableOverview = () => {
  const { timetable } = useTimetable()
  const { year, semester } = useLatestSemester()
  const [examMap, setExamMap] = useState<
    Record<string, { date: string; start_time: string; end_time: string }>
  >({})
  const [moduleMetaMap, setModuleMetaMap] = useState<
    Record<string, { title: string; au: string }>
  >({})

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ year, semester })

    fetch(`/api/data/exams?${params}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { exams: {} }))
      .then((data) => setExamMap(data.exams ?? {}))
      .catch(() => setExamMap({}))

    return () => controller.abort()
  }, [year, semester])

  useEffect(() => {
    const codes = Object.keys(timetable)
    if (!codes.length) {
      setModuleMetaMap({})
      return
    }

    const controller = new AbortController()
    const params = new URLSearchParams({ year, semester })

    Promise.all(
      codes.map((code) =>
        fetch(`/api/data/modules/${code}?${params}`, {
          signal: controller.signal
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) =>
            data
              ? ([
                  code,
                  { title: data.title ?? "", au: data.au ?? "0" }
                ] as const)
              : null
          )
          .catch(() => null)
      )
    ).then((results) => {
      const map: Record<string, { title: string; au: string }> = {}
      for (const entry of results) {
        if (entry) map[entry[0]] = entry[1]
      }
      setModuleMetaMap(map)
    })

    return () => controller.abort()
  }, [timetable, year, semester])

  return (
    <div className="">
      <table className="table w-full table-fixed text-center text-xs">
        <thead>
          <tr className="border-b">
            <th className="w-fit lg:w-[100px]">Index</th>
            <th className="w-fit lg:w-[100px]">Module</th>
            <th className="hidden text-left lg:table-cell">Title</th>
            <th className="w-fit">AU</th>
            <th className="w-fit lg:w-[220px]">Exam</th>
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
                <td className="w-fit lg:w-[100px]">{indexKey}</td>

                <td className="w-fit lg:w-[100px]">
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
    </div>
  )
}

export default TimetableOverview
