/**
 * Build-time data-access layer. One exported function per query — pages and
 * components call these, never read src/data/api directly, so every read
 * used outside this file (and the request-time counterpart,
 * edge/get-module-snapshot.ts, which queries D1 instead) has exactly one
 * place it's written.
 *
 * Everything here reads through json-source.ts, an in-memory cache over
 * src/data/api. Every function stays `async` even though the underlying
 * reads are synchronous — signatures matching the previous SQL-backed
 * implementation means every caller (astro pages, components) needed zero
 * changes when this switched from querying a build-time SQLite copy of D1 to
 * reading the JSON directly.
 */

import * as json from "./json-source"
import type { DbExam, DbModule, DbPrerequisiteNode } from "./types"

let latestSemesterCache: { year: string; semester: string } | null = null

/**
 * The newest semester that actually has offerings loaded.
 *
 * Deliberately not `semesters.json[0]`, which is the portal's catalogue,
 * scraped independently of whether any courses were loaded for those
 * semesters — see json.semestersWithOfferings.
 */
export async function getLatestSemester(): Promise<{
  year: string
  semester: string
}> {
  if (latestSemesterCache) return latestSemesterCache

  const [latest] = json.semestersWithOfferings()
  if (!latest) throw new Error("No semester in src/data/api has any offerings")

  latestSemesterCache = { year: latest.year, semester: latest.semester }
  return latestSemesterCache
}

export async function getLatestExamSemester(): Promise<{
  year: string
  semester: string
} | null> {
  const [latest] = json.semestersWithExams()
  return latest ? { year: latest.year, semester: latest.semester } : null
}

/** Every module code that was ever offered. Used by the sitemap, not getStaticPaths — see getActiveModuleCodes for the build subset. */
export async function getAllModuleCodes(): Promise<string[]> {
  return json.latestOfferings().map((o) => o.code)
}

/**
 * Codes offered in the active/latest semester — the /mods/[module]
 * getStaticPaths subset. Building all ~4,300 codes ever offered dominated
 * build time for pages almost nobody visits; codes not in this set 404 out
 * of the static build and render on demand via src/astro/pages/404.astro +
 * edge/get-module-snapshot.ts's getLatestModuleSnapshot, same D1-backed
 * approach as the versioned snapshot route.
 */
export async function getActiveModuleCodes(): Promise<string[]> {
  return json.activeOfferingCodes()
}

/** Each module's code and title as of its most recent offering. */
export async function getModuleTitles(): Promise<
  Array<{ code: string; title: string }>
> {
  return json
    .latestOfferings()
    .map((o) => ({ code: o.code, title: o.raw.title }))
}

export async function getModuleCurrentSemester(
  code: string
): Promise<{ year: string; semester: string } | null> {
  const [latest] = json.getModuleSemesters(code)
  return latest ? { year: latest.year, semester: latest.semester } : null
}

/** All semesters that offered the module, most recent first. */
export async function getModuleSemesters(
  code: string
): Promise<Array<{ year: string; semester: string }>> {
  return json
    .getModuleSemesters(code)
    .map((s) => ({ year: s.year, semester: s.semester }))
}

export async function getModuleMetadata(
  code: string,
  year: string,
  semester: string
): Promise<DbModule | null> {
  return json.getModuleMetadata(code, year, semester)
}

/**
 * Every module offered in one semester, keyed by code.
 *
 * Callers that only want one module should use getModuleMetadata — this one
 * exists for the pages that genuinely enumerate a semester.
 */
export async function getAllModuleMetadata(
  year: string,
  semester: string
): Promise<Record<string, DbModule>> {
  return json.getAllModuleMetadata(year, semester)
}

/** Module and class-index totals for one semester, for page copy that quotes them. */
export async function getSemesterCounts(
  year: string,
  semester: string
): Promise<{ modules: number; indexes: number }> {
  const codes = Object.keys(json.getAllModuleMetadata(year, semester))
  const indexes = codes.reduce(
    (sum, code) =>
      sum + Object.keys(json.getModuleIndexesData(code, year, semester)).length,
    0
  )
  return { modules: codes.length, indexes }
}

/**
 * Class schedule indexes for a module in one semester.
 * Returns an empty object when the module was not offered that semester.
 */
export async function getModuleIndexesData(
  code: string,
  year: string,
  semester: string
): Promise<Record<string, Index[]>> {
  return json.getModuleIndexesData(code, year, semester)
}

export async function getModuleExamData(
  code: string,
  year: string,
  semester: string
): Promise<DbExam | null> {
  return json.getModuleExamData(code, year, semester)
}

export async function getSemesterExamsData(
  year: string,
  semester: string
): Promise<Record<string, DbExam>> {
  return json.getSemesterExamsData(year, semester)
}

let prerequisiteGraphCache: Record<string, DbPrerequisiteNode> | null = null

/**
 * Each module's prerequisites as of its most recent offering, plus the
 * inverse edges. Only prerequisite items that resolve to a module code
 * become edges — the rest are free text and cannot be graph edges. Modules
 * with no edges in either direction are omitted.
 */
export async function getPrerequisiteGraph(): Promise<
  Record<string, DbPrerequisiteNode>
> {
  prerequisiteGraphCache ??= json.getPrerequisiteGraph()
  return prerequisiteGraphCache
}

export async function getModulePrerequisites(
  code: string
): Promise<DbPrerequisiteNode | null> {
  const graph = await getPrerequisiteGraph()
  return graph[code] ?? null
}
