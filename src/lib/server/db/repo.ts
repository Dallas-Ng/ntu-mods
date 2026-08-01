/**
 * Build-time data-access layer. One exported function per query — pages and
 * components call these, never `query()` + a SQL constant directly, so every
 * query used outside this file (and the request-time counterpart,
 * edge/get-module-snapshot.ts) has exactly one place it's written.
 */

import { query } from "./build-time"
import {
  ALL_MODULE_CODES_SQL,
  LATEST_EXAM_SEMESTER_SQL,
  LATEST_SEMESTER_SQL,
  MODULE_SEMESTERS_SQL,
  MODULE_TITLES_SQL,
  OFFERING_EXAM_SQL,
  OFFERING_INDEX_KEYS_SQL,
  OFFERING_PREREQUISITES_SQL,
  OFFERING_SLOTS_SQL,
  OFFERING_SQL,
  PREREQUISITE_GRAPH_EDGES_SQL,
  PREREQUISITE_GRAPH_TITLES_SQL,
  SEMESTER_EXAMS_SQL,
  SEMESTER_OFFERINGS_SQL,
  SEMESTER_PREREQUISITES_SQL
} from "./queries"
import { toApiExam, toApiModule, toIndexes } from "./shape"
import type {
  ExamRow,
  OfferingRow,
  PrerequisiteRow,
  SemesterRow,
  SlotRow
} from "./shape"
import type { ApiExam, ApiModule, PrerequisiteNode } from "./types"

let latestSemesterCache: { year: string; semester: string } | null = null

/**
 * The newest semester that actually has offerings loaded.
 *
 * Deliberately not `semesters.json[0]`, which is the portal's catalogue,
 * scraped independently of whether any courses were loaded for those
 * semesters — see LATEST_SEMESTER_SQL.
 */
export async function getLatestSemester(): Promise<{
  year: string
  semester: string
}> {
  if (latestSemesterCache) return latestSemesterCache

  const row = query<SemesterRow>(LATEST_SEMESTER_SQL)[0]
  if (!row) throw new Error("No semester in the database has any offerings")

  latestSemesterCache = { year: row.year, semester: row.semester }
  return latestSemesterCache
}

export async function getLatestExamSemester(): Promise<{
  year: string
  semester: string
} | null> {
  const row = query<SemesterRow>(LATEST_EXAM_SEMESTER_SQL)[0]
  return row ? { year: row.year, semester: row.semester } : null
}

/** Every module code that was ever offered, for getStaticPaths. */
export async function getAllModuleCodes(): Promise<string[]> {
  return query<{ code: string }>(ALL_MODULE_CODES_SQL).map((r) => r.code)
}

export async function getModuleTitles(): Promise<
  Array<{ code: string; title: string }>
> {
  return query<{ code: string; title: string }>(MODULE_TITLES_SQL)
}

/**
 * Both of these previously walked all 45 metadata files in reverse, parsing
 * whole 1.2 MB semester files just to test whether one key was present — with
 * a module-level file cache bolted on to stop that happening once per module.
 * Now it is an indexed lookup.
 *
 * Ordering comes from semesters.sort_key rather than filename sort. Filename
 * sort placed "2025_S" after "2025_2" only by luck of ASCII ordering.
 */
export async function getModuleCurrentSemester(
  code: string
): Promise<{ year: string; semester: string } | null> {
  const row = query<{ sem: string; year: string; semester: string }>(
    `${MODULE_SEMESTERS_SQL} LIMIT 1`,
    code
  )[0]
  return row ? { year: row.year, semester: row.semester } : null
}

/** All semesters that offered the module, most recent first. */
export async function getModuleSemesters(
  code: string
): Promise<Array<{ year: string; semester: string }>> {
  return query<{ sem: string; year: string; semester: string }>(
    MODULE_SEMESTERS_SQL,
    code
  ).map((r) => ({ year: r.year, semester: r.semester }))
}

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

  const rows = query<OfferingRow>(SEMESTER_OFFERINGS_SQL, sem)
  if (rows.length === 0) return {}

  const prereqRows = query<PrerequisiteRow & { code: string }>(
    SEMESTER_PREREQUISITES_SQL,
    sem
  )
  const prereqsByCode = new Map<string, PrerequisiteRow[]>()
  for (const p of prereqRows) {
    let list = prereqsByCode.get(p.code)
    if (!list) prereqsByCode.set(p.code, (list = []))
    list.push(p)
  }

  return Object.fromEntries(
    rows.map((row) => [
      row.code,
      toApiModule(row, prereqsByCode.get(row.code) ?? [])
    ])
  )
}

/**
 * Class schedule indexes for a module in one semester.
 * Returns an empty object when the module was not offered that semester.
 *
 * Index keys are read from class_indexes rather than inferred from the slot
 * rows: 24 offerings across the corpus have an index with no slots, and the
 * JSON this replaces represented those as a present-but-empty entry.
 */
export async function getModuleIndexesData(
  code: string,
  year: string,
  semester: string
): Promise<Record<string, Index[]>> {
  const sem = `${year}_${semester}`
  const keys = query<{ index_key: string }>(
    OFFERING_INDEX_KEYS_SQL,
    code,
    sem
  ).map((r) => r.index_key)
  if (keys.length === 0) return {}
  return toIndexes(query<SlotRow>(OFFERING_SLOTS_SQL, code, sem), keys)
}

export async function getModuleExamData(
  code: string,
  year: string,
  semester: string
): Promise<ApiExam | null> {
  const row = query<ExamRow>(OFFERING_EXAM_SQL, code, `${year}_${semester}`)[0]
  return row ? toApiExam(row) : null
}

export async function getSemesterExamsData(
  year: string,
  semester: string
): Promise<Record<string, ApiExam>> {
  const rows = query<ExamRow>(SEMESTER_EXAMS_SQL, `${year}_${semester}`)
  return Object.fromEntries(rows.map((r) => [r.code, toApiExam(r)]))
}

type PrerequisiteGraph = Record<string, PrerequisiteNode>

let prerequisiteGraphCache: PrerequisiteGraph | null = null

/**
 * Each module's prerequisites as of its most recent offering, plus the inverse
 * edges. Replaces prerequisite-graph.json.
 *
 * Only prerequisite items that resolve to a module code become edges; the
 * remaining 30% are free text ("NGL students are taking AL1001, cannot read
 * AB1088") and cannot be graph edges. Unlike the JSON build, that text is not
 * discarded — it stays in prerequisites.raw_text and can be surfaced later.
 *
 * Modules with no edges in either direction are omitted, matching the previous
 * artifact.
 */
export async function getPrerequisiteGraph(): Promise<PrerequisiteGraph> {
  if (prerequisiteGraphCache) return prerequisiteGraphCache

  const titles = query<{ code: string; title: string }>(
    PREREQUISITE_GRAPH_TITLES_SQL
  )
  const edges = query<{ code: string; requires: string }>(
    PREREQUISITE_GRAPH_EDGES_SQL
  )

  const graph: PrerequisiteGraph = {}
  const titleByCode = new Map(titles.map((t) => [t.code, t.title]))

  // A node only exists for a code that was actually offered. A prerequisite may
  // name a module that never appears in the corpus — that stays as an outgoing
  // edge but never becomes a node of its own, which is what the previous
  // artifact did.
  const node = (code: string): PrerequisiteNode | null => {
    const title = titleByCode.get(code)
    if (title === undefined) return null
    return (graph[code] ??= { title, requires: [], requiredBy: [] })
  }

  for (const e of edges) {
    node(e.code)?.requires.push(e.requires)
    node(e.requires)?.requiredBy.push(e.code)
  }

  // requiredBy accumulates in `code` order from the query, but the previous
  // artifact sorted it explicitly. Keep that.
  for (const n of Object.values(graph)) n.requiredBy.sort()

  prerequisiteGraphCache = graph
  return prerequisiteGraphCache
}

export async function getModulePrerequisites(
  code: string
): Promise<PrerequisiteNode | null> {
  const graph = await getPrerequisiteGraph()
  return graph[code] ?? null
}
