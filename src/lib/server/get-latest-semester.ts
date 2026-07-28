import { query } from "./db/build-time"
import { LATEST_SEMESTER_SQL } from "./db/queries"
import type { SemesterRow } from "./db/shape"

let cached: { year: string; semester: string } | null = null

/**
 * The newest semester that actually has offerings loaded.
 *
 * Previously read `semesters.json[0]` — the portal's catalogue, which is
 * scraped independently of whether any courses were loaded for those
 * semesters, so it could point at an empty semester. See LATEST_SEMESTER_SQL.
 */
export async function getLatestSemester(): Promise<{
  year: string
  semester: string
}> {
  if (cached) return cached

  const row = query<SemesterRow>(LATEST_SEMESTER_SQL)[0]
  if (!row) throw new Error("No semester in the database has any offerings")

  cached = { year: row.year, semester: row.semester }
  return cached
}
