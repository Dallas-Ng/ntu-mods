import type { Metadata } from "next"
import Link from "next/link"
import SEMESTERS_JSON from "@/data/api/semesters.json"

import {
  LATEST_SEMESTER_LABEL,
  latestSemester,
  latestYear
} from "@/lib/semesters"
import { getSemesterExamsData } from "@/lib/server/get-module-exam-data"
import Container from "@/components/container"
import ExamsList from "@/components/exams/exams-list"
import Header from "@/components/header"

export const dynamic = "force-static"
export const revalidate = false

const LAST_UPDATED = "14 June 2026"

async function getExamData() {
  let exams = await getSemesterExamsData(latestYear, latestSemester)
  let label = LATEST_SEMESTER_LABEL

  if (Object.keys(exams).length === 0) {
    for (const sem of (
      SEMESTERS_JSON as { code: string; name: string }[]
    ).slice(1)) {
      const [y, s] = sem.code.split(";")
      const data = await getSemesterExamsData(y, s)
      if (Object.keys(data).length > 0) {
        exams = data
        const isSpecial = s === "S" || s === "T"
        label = isSpecial ? `AY${y} Special Term` : `AY${y} Semester ${s}`
        break
      }
    }
  }

  return { exams, label }
}

export async function generateMetadata(): Promise<Metadata> {
  const { exams, label } = await getExamData()
  const total = Object.keys(exams).length
  return {
    title: `NTU Exam Schedule ${label}`,
    description: `Browse ${total} NTU exams for ${label}. Search by module code or name, and check exam dates, times, and durations.`
  }
}

export default async function ExamsPage() {
  const { exams, label } = await getExamData()
  const examList = Object.values(exams)
  const total = examList.length

  return (
    <Container size="md" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Header
          title="NTU Exam Schedule"
          subtitle={
            total > 0
              ? `${total} exams for ${label}`
              : `No exam data available for ${label}`
          }
        />
        <p className="text-muted-foreground shrink-0 pb-1 text-xs">
          Updated {LAST_UPDATED}
        </p>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">
          Showing {total} NTU exams for {label}. Search by module code or name,
          or group by date or school to plan your revision schedule. Exam data
          is sourced from NTU&apos;s official timetable and updated each
          semester.
        </p>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Related guides</p>
          <div className="flex flex-col gap-1">
            <Link
              href="/articles/ntu-exam-schedule-ay2026"
              className="text-sm text-blue-500 hover:underline">
              NTU Exam Schedule AY2026/2027 — How to Find Your Exam Dates →
            </Link>
            <Link
              href="/articles/how-to-plan-for-modules"
              className="text-sm text-blue-500 hover:underline">
              How to Plan NTU Modules Before STARS Opens →
            </Link>
          </div>
        </div>
      </div>

      <ExamsList exams={examList} />
    </Container>
  )
}
