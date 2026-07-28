import { query } from "./db/build-time"
import { MODULE_SEMESTERS_SQL } from "./db/queries"

interface Row {
  sem: string
  year: string
  semester: string
}

/**
 * Both of these previously walked all 45 metadata files in reverse, parsing
 * whole 1.2 MB semester files just to test whether one key was present — with a
 * module-level file cache bolted on to stop that happening once per module.
 * Now it is an indexed lookup.
 *
 * Ordering comes from semesters.sort_key rather than filename sort. Filename
 * sort placed "2025_S" after "2025_2" only by luck of ASCII ordering.
 */
export async function getModuleCurrentSemester(
  code: string
): Promise<{ year: string; semester: string } | null> {
  const row = query<Row>(`${MODULE_SEMESTERS_SQL} LIMIT 1`, code)[0]
  return row ? { year: row.year, semester: row.semester } : null
}

/** All semesters that offered the module, most recent first. */
export async function getModuleSemesters(
  code: string
): Promise<Array<{ year: string; semester: string }>> {
  return query<Row>(MODULE_SEMESTERS_SQL, code).map((r) => ({
    year: r.year,
    semester: r.semester,
  }))
}
