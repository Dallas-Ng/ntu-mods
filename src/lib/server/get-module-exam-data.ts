import fs from "fs/promises"
import path from "path"

const EXAMS_DIR = path.join(process.cwd(), "src/data/api/exams")

export interface ApiExam {
  date: string
  day: number
  start_time: string
  end_time: string
  key: string
  name: string
  duration?: number
}

async function readExamFile(
  year: string,
  semester: string
): Promise<Record<string, ApiExam> | null> {
  const filePath = path.join(EXAMS_DIR, `${year}_${semester}.json`)
  try {
    await fs.access(filePath)
    const data = await fs.readFile(filePath, "utf-8")
    return JSON.parse(data) as Record<string, ApiExam>
  } catch {
    return null
  }
}

export async function getSemesterExamsData(
  year: string,
  semester: string
): Promise<Record<string, ApiExam>> {
  return (await readExamFile(year, semester)) ?? {}
}

export async function getModuleExamData(
  code: string,
  year: string,
  semester: string
): Promise<ApiExam | null> {
  const exams = await readExamFile(year, semester)
  if (!exams) return null
  return exams[code] ?? null
}
