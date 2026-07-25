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

// This file is shared across every module offered in a semester — without
// caching, generating all the historic snapshot pages for one semester
// re-reads and re-parses the same file once per module.
const fileCache = new Map<string, Record<string, ApiExam> | null>()

async function readExamFile(
  year: string,
  semester: string
): Promise<Record<string, ApiExam> | null> {
  const key = `${year}_${semester}`
  if (fileCache.has(key)) return fileCache.get(key) ?? null

  const filePath = path.join(EXAMS_DIR, `${year}_${semester}.json`)
  let result: Record<string, ApiExam> | null
  try {
    await fs.access(filePath)
    const data = await fs.readFile(filePath, "utf-8")
    result = JSON.parse(data) as Record<string, ApiExam>
  } catch {
    result = null
  }
  fileCache.set(key, result)
  return result
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
