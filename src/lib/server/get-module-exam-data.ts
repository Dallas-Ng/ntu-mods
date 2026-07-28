import { query } from "./db/build-time"
import { OFFERING_EXAM_SQL } from "./db/queries"
import { toApiExam } from "./db/shape"
import type { ExamRow } from "./db/shape"

export interface ApiExam {
  date: string
  day: number
  start_time: string
  end_time: string
  key: string
  name: string
  duration?: number
}

/** Every exam in one semester, keyed by module code. */
export async function getSemesterExamsData(
  year: string,
  semester: string
): Promise<Record<string, ApiExam>> {
  const rows = query<ExamRow>(
    `SELECT code, date, day, start_time, end_time, name, duration
       FROM exams WHERE sem = ? ORDER BY code`,
    `${year}_${semester}`
  )
  return Object.fromEntries(rows.map((r) => [r.code, toApiExam(r)]))
}

export async function getModuleExamData(
  code: string,
  year: string,
  semester: string
): Promise<ApiExam | null> {
  const row = query<ExamRow>(OFFERING_EXAM_SQL, code, `${year}_${semester}`)[0]
  return row ? toApiExam(row) : null
}
