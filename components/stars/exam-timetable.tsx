"use client"

import Link from "next/link"
import { C_EXAMS } from "@/data/2023-exams"
import { useBoundState } from "@/state/bound-state"

import { DAY_TRUN_MAP } from "@/config/stars"
import { formatTitle } from "@/lib/stars.lib"
import { cn } from "@/lib/utils"
import { useQueryStringCTI } from "@/hooks/use-qs-CTI"

export default function ExamTimetable() {
  const coursesToIndexFromQueryString = useQueryStringCTI()
  const coursesToIndexFromState = useBoundState().coursesToIndex

  let coursesToIndex =
    Object.keys(coursesToIndexFromQueryString).length > 0
      ? coursesToIndexFromQueryString
      : coursesToIndexFromState

  const exams = Object.keys(coursesToIndex)
    .map((courseKey) => (courseKey in C_EXAMS ? C_EXAMS[courseKey] : null))
    .filter((x) => x) as Exam[]

  const examsSorted =
    exams.length > 0
      ? (exams.sort((a, b) => {
          const dateA = new Date(Date.parse(a.date)).getTime()
          const dateB = new Date(Date.parse(b.date)).getTime()
          return dateA - dateB
        }) as Exam[])
      : []

  // Remove leading 0 and replace . with :
  const formatTime = (time: string) => time.replace(/^0/, "").replace(".", ":")

  return (
    <table className="table w-full text-center text-xs">
      <thead>
        <tr className="border-b text-secondary">
          <td className="p-1 md:p-2">Course Code</td>
          <td className="hidden p-1 text-left md:table-cell md:p-2">Name</td>
          <td className="p-1 md:p-2">Date</td>
          <td className="p-1 md:p-2">Day</td>
          <td className="p-1 md:p-2">Start Time</td>
          <td className="p-1 md:p-2">End Time</td>
        </tr>
      </thead>

      <tbody>
        {examsSorted.map((exam, idx) => (
          <tr key={exam.key} className={cn(idx % 2 == 1 && "bg-accent")}>
            <td className="p-2">
              <Link
                href={`/mods/${exam.key}`}
                className="transition-colors hover:text-secondary-foreground">
                {exam.key}
              </Link>
            </td>
            <td className="hidden p-2 text-left capitalize md:table-cell">
              <Link
                href={`/mods/${exam.key}`}
                className="transition-colors hover:text-secondary-foreground">
                {formatTitle(exam.name)}
              </Link>
            </td>
            <td className="p-2">{exam.date.replace(" 2024", "")}</td>
            <td className="p-2">{DAY_TRUN_MAP[exam.day]}</td>
            <td className="min-w-[70px] p-2">{formatTime(exam.start_time)}</td>
            <td className="min-w-[70px] p-2">{formatTime(exam.end_time)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
