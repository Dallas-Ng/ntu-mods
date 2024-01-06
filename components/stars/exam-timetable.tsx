"use client"

import { useBoundState } from "@/state/bound-state"

import { C_EXAMS } from "@/lib/consolidated-data"
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

  return (
    <table className="table w-full text-center text-xs">
      <thead>
        <tr className="border-b text-secondary">
          <td className="p-1 md:p-2">Course Code</td>
          <td className="p-1 md:p-2">Name</td>
          <td className="p-1 md:p-2">Date</td>
          <td className="p-1 md:p-2">Day</td>
          <td className="p-1 md:p-2">Start Time</td>
          <td className="p-1 md:p-2">End Time</td>
        </tr>
      </thead>

      <tbody>
        {exams.map((exam, idx) => (
          <tr key={exam.key} className={cn(idx % 2 == 1 && "bg-secondary")}>
            <td className="p-2">{exam.key}</td>
            <td className="p-2 capitalize">{formatTitle(exam.name)}</td>
            <td className="p-2">{exam.date}</td>
            <td className="p-2">{exam.day}</td>
            <td className="p-2">{exam.start_time}</td>
            <td className="p-2">{exam.end_time}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
