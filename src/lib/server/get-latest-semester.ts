import fs from "fs/promises"
import path from "path"

interface SemesterEntry {
  code: string
}

let cached: { year: string; semester: string } | null = null

/**
 * Get latest semester from src/data/api/semesters.json.
 * The value is cached in-memory since it is static at runtime.
 */
export async function getLatestSemester(): Promise<{
  year: string
  semester: string
}> {
  if (cached) return cached

  const filePath = path.join(process.cwd(), "src/data/api/semesters.json")
  const data = await fs.readFile(filePath, "utf-8")
  const semesters = JSON.parse(data) as SemesterEntry[]

  if (!Array.isArray(semesters) || semesters.length === 0) {
    throw new Error("No semesters found in src/data/api/semesters.json")
  }

  const latestCode = semesters[0].code
  const [year, semester] = latestCode.split(";")
  if (!year || !semester) {
    throw new Error(`Invalid semester code format: ${latestCode}`)
  }

  cached = { year, semester }
  return cached
}
