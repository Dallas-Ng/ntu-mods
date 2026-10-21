"use client"

import { useEffect, useState } from "react"

import { reportError } from "@/lib/analytics"
import { latestSemester, latestYear } from "@/lib/semesters"
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
      .then((res) => {
        // 404: exam timetable not published yet. Empty, not an error.
        if (res.status === 404) return {}
        if (!res.ok) throw new Error(`exams ${res.status}`)
        return res.json()
      })
      .then((data) => setExamMap(data ?? {}))
      .catch((e) => {
        if (controller.signal.aborted) return
        reportError("exams_fetch", e, { year, semester })
        setExamMap({})
      })

    return () => controller.abort()
  }, [year, semester])

  const moduleMetaMap = Object.fromEntries(
    modules
      .filter((m) => timetable[m.code])
      .map((m) => [m.code, { title: m.title, au: m.au }])
  )

  // Nothing to summarise yet: no empty table, no exam note.
  if (Object.keys(timetable).length === 0) return null

  return (
    <div className="">
      <div className="overflow-x-auto">
        <table className="data-table w-full rounded-lg! border-2! border-slate-200! text-xs! dark:border-slate-900! [&_td]:px-2.5! [&_td]:py-1.5! [&_th]:px-2.5! [&_th]:py-1.5!">
          <thead>
            <tr>
              <th>Index</th>
              <th>Module</th>
              <th className="hidden lg:table-cell">Title</th>
              <th>AU</th>
              <th>Exam</th>
            </tr>
          </thead>

          <tbody>
            {Object.entries(timetable).map(([moduleKey, indexKey]) => {
              const meta = moduleMetaMap[moduleKey]
              const moduleTitle = meta?.title ?? ""
              const au = meta?.au ?? "0"
              const exam = examMap[moduleKey]
              const examDisplay = exam
                ? `${exam.date}, ${exam.start_time} - ${exam.end_time}`
                : "-"

              return (
                <tr key={moduleKey}>
                  <td>{indexKey}</td>

                  <td>
                    <a
                      href={`/mods/${moduleKey}`}
                      className="hover:text-primary-alt font-medium transition-colors">
                      {moduleKey}
                    </a>
                  </td>

                  <td className="hidden lg:table-cell">
                    <a
                      href={`/mods/${moduleKey}`}
                      className="hover:text-primary-alt transition-colors">
                      {moduleTitle}
                    </a>
                  </td>

                  <td>{au}</td>
                  <td>{examDisplay}</td>
                </tr>
              )
            })}
          </tbody>

          <tfoot>
            <tr>
              <td className="font-medium" colSpan={2}>
                Total
              </td>
              <td className="hidden lg:table-cell"></td>
              <td className="font-medium">
                {Object.keys(timetable)
                  .reduce((acc, moduleKey) => {
                    const au =
                      parseFloat(moduleMetaMap[moduleKey]?.au ?? "0") || 0
                    return acc + au
                  }, 0)
                  .toFixed(1)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        The Exam information shown may be subject to changes. Students are to
        check the finalised exam timetable with exam seat information, which
        will be available at the &apos;Examination Seating Arrangement&apos;
        webpage, 2 weeks before start of examination. You may visit{" "}
        <a
          href="/exams"
          className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
          NTU mods exams page
        </a>{" "}
        for more information.
      </p>
    </div>
  )
}

export default TimetableOverview
