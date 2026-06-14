import SEMESTERS_JSON from "@/data/api/semesters.json"
import { getSemesterExamsData } from "@/lib/server/get-module-exam-data"
import { latestSemester, latestYear, LATEST_SEMESTER_LABEL } from "@/lib/semesters"
import Container from "@/components/container"
import ExamsList from "@/components/exams/exams-list"
import Header from "@/components/header"

export const dynamic = "force-static"
export const revalidate = false

const LAST_UPDATED = "14 June 2026"

export default async function ExamsPage() {
  let exams = await getSemesterExamsData(latestYear, latestSemester)
  let label = LATEST_SEMESTER_LABEL

  if (Object.keys(exams).length === 0) {
    for (const sem of (SEMESTERS_JSON as { code: string; name: string }[]).slice(1)) {
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

      <ExamsList exams={examList} />
    </Container>
  )
}
