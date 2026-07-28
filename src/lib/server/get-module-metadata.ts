import { query } from "./db/build-time"
import { OFFERING_PREREQUISITES_SQL, OFFERING_SQL } from "./db/queries"
import { toApiModule } from "./db/shape"
import type { OfferingRow, PrerequisiteRow } from "./db/shape"

/**
 * Server-side module data. Structurally overlaps with the global Module type
 * but description is optional here (not all entries have it) and includes
 * additional server/API-only fields.
 */
export interface ApiModule {
  code: string
  title: string
  au: string
  searchKeys: string[]
  prerequisite?: string[][]
  description?: string
  gradeType?: string
  mutuallyExclusiveWith?: string[]
  notAvailableToProgramme?: string
  notAvailableToAllProgrammeWith?: string
  notAvailableAsBdeueToProgramme?: string
  notAvailableAsCoreToProgramme?: string
  notAvailableAsPeToProgramme?: string
  notOfferedAsBde?: string
  notOfferedAsUe?: string
  extras?: Record<string, string>
  isCurrentSemester?: boolean
  latestYear?: string
  latestSemester?: string
}

/** Read a single module's record for one semester. */
export async function getModuleMetadata(
  code: string,
  year: string,
  semester: string
): Promise<ApiModule | null> {
  const sem = `${year}_${semester}`
  const row = query<OfferingRow>(OFFERING_SQL, code, sem)[0]
  if (!row) return null
  const prereqs = query<PrerequisiteRow>(OFFERING_PREREQUISITES_SQL, code, sem)
  return toApiModule(row, prereqs)
}

/**
 * Every module offered in one semester, keyed by code.
 *
 * Previously parsed a whole 1.2 MB semester file. Callers that only want one
 * module should use getModuleMetadata — this one exists for the pages that
 * genuinely enumerate a semester.
 */
export async function getAllModuleMetadata(
  year: string,
  semester: string
): Promise<Record<string, ApiModule>> {
  const sem = `${year}_${semester}`

  const rows = query<OfferingRow>(
    `SELECT o.*,
            (SELECT json_group_array(key) FROM (
               SELECT p.key AS key
                 FROM offering_programmes op
                 JOIN programmes p ON p.id = op.programme_id
                WHERE op.code = o.code AND op.sem = o.sem
                ORDER BY op.seq
            )) AS search_keys
       FROM offerings o
      WHERE o.sem = ?
      ORDER BY o.code`,
    sem
  )
  if (rows.length === 0) return {}

  const prereqRows = query<PrerequisiteRow & { code: string }>(
    `SELECT code, group_no, item_no, raw_text
       FROM prerequisites WHERE sem = ?
      ORDER BY code, group_no, item_no`,
    sem
  )
  const prereqsByCode = new Map<string, PrerequisiteRow[]>()
  for (const p of prereqRows) {
    let list = prereqsByCode.get(p.code)
    if (!list) prereqsByCode.set(p.code, (list = []))
    list.push(p)
  }

  return Object.fromEntries(
    rows.map((row) => [row.code, toApiModule(row, prereqsByCode.get(row.code) ?? [])])
  )
}
