/**
 * Row -> app shape mappers, shared by the build-time `node:sqlite` reader and
 * the request-time D1 reader.
 *
 * The app's existing types (ApiModule, Index, ApiExam) are the contract these
 * must satisfy exactly — every consumer downstream of them is unchanged by the
 * migration, and scripts/db/verify-parity.mjs asserts the reconstruction is
 * byte-identical to the JSON it replaces.
 */

import type { ApiExam } from "@/lib/server/get-module-exam-data"
import type { ApiModule } from "@/lib/server/get-module-metadata"

export interface OfferingRow {
  code: string
  sem: string
  title: string
  au: string
  faculty: string | null
  categories: string | null
  description: string | null
  grade_type: string | null
  not_available_to_programme: string | null
  not_available_to_all_programme_with: string | null
  not_available_as_bdeue_to_programme: string | null
  not_available_as_core_to_programme: string | null
  not_available_as_pe_to_programme: string | null
  not_offered_as_bde: string | null
  not_offered_as_ue: string | null
  mutually_exclusive_with: string | null
  extras: string | null
  search_keys?: string | null
}

export interface SlotRow {
  index_key: string
  slot_no: number
  type: string | null
  grp: string | null
  day: number | null
  time: string | null
  venue: string | null
  remarks: string | null
  duration: number | null
}

export interface PrerequisiteRow {
  group_no: number
  item_no: number
  raw_text: string
}

export interface ExamRow {
  code: string
  date: string | null
  day: number | null
  start_time: string | null
  end_time: string | null
  name: string | null
  duration: number | null
}

export interface SemesterRow {
  sem: string
  code: string
  year: string
  semester: string
  name: string
}

const parseJson = <T>(value: string | null | undefined): T | undefined =>
  value == null ? undefined : (JSON.parse(value) as T)

/**
 * Absent optional fields are left unset rather than set to undefined, matching
 * the original JSON where the key simply was not present.
 */
function setOptional<K extends keyof ApiModule>(
  target: ApiModule,
  key: K,
  value: ApiModule[K] | null | undefined
) {
  if (value !== null && value !== undefined) target[key] = value
}

export function toApiModule(
  row: OfferingRow,
  prerequisites: PrerequisiteRow[]
): ApiModule {
  const module: ApiModule = {
    searchKeys: parseJson<string[]>(row.search_keys) ?? [],
    code: row.code,
    title: row.title,
    au: row.au
  }

  setOptional(module, "description", row.description)
  setOptional(module, "gradeType", row.grade_type)
  setOptional(module, "notAvailableToProgramme", row.not_available_to_programme)
  setOptional(
    module,
    "notAvailableToAllProgrammeWith",
    row.not_available_to_all_programme_with
  )
  setOptional(
    module,
    "notAvailableAsBdeueToProgramme",
    row.not_available_as_bdeue_to_programme
  )
  setOptional(
    module,
    "notAvailableAsCoreToProgramme",
    row.not_available_as_core_to_programme
  )
  setOptional(
    module,
    "notAvailableAsPeToProgramme",
    row.not_available_as_pe_to_programme
  )
  setOptional(module, "notOfferedAsBde", row.not_offered_as_bde)
  setOptional(module, "notOfferedAsUe", row.not_offered_as_ue)
  setOptional(
    module,
    "mutuallyExclusiveWith",
    parseJson<string[]>(row.mutually_exclusive_with)
  )
  setOptional(module, "extras", parseJson<Record<string, string>>(row.extras))

  if (prerequisites.length > 0) {
    const groups: string[][] = []
    for (const p of prerequisites) {
      while (groups.length <= p.group_no) groups.push([])
      groups[p.group_no].push(p.raw_text)
    }
    module.prerequisite = groups
  }

  return module
}

/**
 * Rebuilds `{ [indexKey]: Index[] }`.
 *
 * `indexKeys` must come from class_indexes, not from the slot rows: 24
 * offerings across the corpus have an index with no slots, and dropping them
 * would silently change the shape the app sees.
 */
export function toIndexes(
  slots: SlotRow[],
  indexKeys: string[]
): Record<string, Index[]> {
  const result: Record<string, Index[]> = {}
  for (const key of indexKeys) result[key] = []
  for (const s of slots) {
    ;(result[s.index_key] ??= []).push({
      key: s.index_key,
      type: s.type,
      group: s.grp,
      day: s.day,
      time: s.time,
      venue: s.venue,
      remarks: s.remarks,
      duration: s.duration
    } as unknown as Index)
  }
  return result
}

export function toApiExam(row: ExamRow): ApiExam {
  return {
    date: row.date,
    day: row.day,
    start_time: row.start_time,
    end_time: row.end_time,
    key: row.code,
    name: row.name,
    duration: row.duration
  } as unknown as ApiExam
}
