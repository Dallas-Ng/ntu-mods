"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp } from "lucide-react"

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
  const [open, setOpen] = useState(false)

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

  const moduleCount = Object.keys(timetable).length
  const totalAU = Object.keys(timetable)
    .reduce((acc, moduleKey) => {
      const au = parseFloat(moduleMetaMap[moduleKey]?.au ?? "0") || 0
      return acc + au
    }, 0)
    .toFixed(1)

  if (moduleCount === 0) return null

  return (
    <div className="rounded-lg border">
      {/* Collapsible header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="hover:bg-accent/50 flex w-full items-center justify-between px-3 py-2 text-sm transition-colors">
        <span className="font-medium">
          Overview · {moduleCount} module{moduleCount !== 1 ? "s" : ""} · exam
          dates &amp; AU breakdown
        </span>
        {open ? (
          <ChevronUp className="text-muted-foreground size-4" />
        ) : (
          <ChevronDown className="text-muted-foreground size-4" />
        )}
      </button>

      {open && (
        <>
          <table className="table w-full table-fixed text-center text-xs">
            <thead>
              <tr className="border-t border-b">
                <th className="w-fit py-1.5 lg:w-25">Index</th>
                <th className="w-fit lg:w-25">Module</th>
                <th className="hidden text-left lg:table-cell">Title</th>
                <th className="w-fit">AU</th>
                <th className="w-fit lg:w-55">Exam</th>
              </tr>
            </thead>

            <tbody>
              {Object.entries(timetable).map(([moduleKey, indexKey], i) => {
                const meta = moduleMetaMap[moduleKey]
                const moduleTitle = meta?.title ?? ""
                const au = meta?.au ?? "0"
                const exam = examMap[moduleKey]
                const examDisplay = exam
                  ? `${exam.date}, ${exam.start_time} – ${exam.end_time}`
                  : ""

                return (
                  <tr
                    key={moduleKey}
                    className={cn(i % 2 === 1 && "bg-muted")}>
                    <td className="py-1">{indexKey}</td>

                    <td>
                      <Link
                        href={`/mods/${moduleKey}`}
                        className="hover:text-primary transition-colors">
                        {moduleKey}
                      </Link>
                    </td>

                    <td className="hidden text-left lg:table-cell">
                      <Link
                        href={`/mods/${moduleKey}`}
                        className="hover:text-primary transition-colors">
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
                <td className="py-1 font-medium">{totalAU} AU</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <p className="text-muted-foreground border-t px-3 py-2 text-xs">
            Exam info may be subject to changes. Check the finalised exam
            timetable with seat info, available 2 weeks before exams.
          </p>
        </>
      )}
    </div>
  )
}

export default TimetableOverview
