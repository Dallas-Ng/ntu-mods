/**
 * In-memory reader over src/data/api, the canonical data source for
 * everything except the on-demand historic-snapshot route (which reads D1
 * live instead — see edge/get-module-snapshot.ts). Used by db/repo.ts and by
 * the two build scripts (build-static-data.mts, build-sitemap.mts) so there
 * is exactly one place that walks the JSON tree.
 *
 * Each semester file is read and parsed once, then cached for the life of
 * the process — a full build touches every semester anyway (getStaticPaths
 * alone spans all of them), so this is a straight win over re-parsing.
 *
 * Faculty/category derivation and semester-name/ordering logic mirror
 * scripts/db/lib/derive.mjs. That file can't import this one — it's a plain
 * .mjs run by `node` directly, no TypeScript loader — so the two are kept in
 * sync by hand. This side gets to import src/lib/module-constants.ts normally
 * rather than scraping it as source text, which is why MODULE_FACULTY here
 * is a real import instead of a regex.
 */

import fs from "fs"
import path from "path"

import { MODULE_CODE_RE, MODULE_FACULTY } from "@/lib/module-constants"
import type {
  DbExam,
  DbModule,
  DbPrerequisiteNode
} from "@/lib/server/db/types"

const SRC = path.join(process.cwd(), "src/data/api")

const SEM_ORDER: Record<string, number> = { "1": 1, "2": 2, S: 3, T: 4 }

function sortKeyOf(year: string, semester: string): number {
  const rank = SEM_ORDER[semester]
  if (rank === undefined) throw new Error(`Unknown semester type: ${semester}`)
  return Number(year) * 10 + rank
}

export interface SemesterEntry {
  sem: string
  year: string
  semester: string
  sortKey: number
}

function parseSem(sem: string): SemesterEntry {
  const idx = sem.indexOf("_")
  const year = sem.slice(0, idx)
  const semester = sem.slice(idx + 1)
  return { sem, year, semester, sortKey: sortKeyOf(year, semester) }
}

const SEM_LABEL: Record<string, string> = {
  "1": "Semester 1",
  "2": "Semester 2",
  S: "Special Term",
  T: "Teaching Term"
}

/** Fallback name for a semester the committed semesters.json doesn't already have a portal name for. */
export function semesterName(year: string, semester: string): string {
  return `Acad Yr ${year} ${SEM_LABEL[semester] ?? `Semester ${semester}`}`
}

const FACULTY_KEYS = Object.keys(MODULE_FACULTY)

/**
 * A module's faculty, from its programme keys. Mirrors derive.mjs's
 * deriveFaculty exactly: last matching segment across all searchKeys wins,
 * "" if nothing matches.
 */
export function deriveFaculty(searchKeys: string[]): string {
  let result = ""
  for (const term of searchKeys) {
    for (const segment of term.split(";")) {
      for (const faculty of FACULTY_KEYS) {
        if (segment === faculty) result = segment
      }
    }
  }
  return result
}

/**
 * A module's categories, from its programme keys. Mirrors derive.mjs's
 * deriveCategories exactly, bugs included — see that file for why.
 */
export function deriveCategories(searchKeys: string[]): string[] {
  const included = new Set<string>()

  if (searchKeys.find((x) => x.split(";").length === 4)) included.add("CORE")

  for (const key of searchKeys) {
    if (key.includes("GLOAD")) included.add("GLOAD")
    else if (key.includes("MLOAD")) included.add("MLOAD")
    else if (key.includes("GERP")) included.add("GERP")
    else if (key.includes("CNY")) included.add("CNY")
    else if (key.includes("USP")) included.add("CNY")
  }

  return Array.from(included)
}

/** One entry in metadata/{sem}.json — the raw scraped shape, before faculty/categories are derived. */
type RawModule = Omit<
  DbModule,
  | "faculty"
  | "categories"
  | "isCurrentSemester"
  | "latestYear"
  | "latestSemester"
>
type MetadataFile = Record<string, RawModule>
type IndexesFile = Record<string, Record<string, Index[]>>
type ExamsFile = Record<string, DbExam>

const readJson = <T>(p: string, fallback: T): T =>
  fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf-8")) as T) : fallback

const metadataCache = new Map<string, MetadataFile>()
function readMetadata(sem: string): MetadataFile {
  let data = metadataCache.get(sem)
  if (!data) {
    data = readJson(path.join(SRC, "metadata", `${sem}.json`), {})
    metadataCache.set(sem, data)
  }
  return data
}

const indexesCache = new Map<string, IndexesFile>()
/**
 * Index keys are sorted per module on the way in — the raw file's nested
 * order follows scrape order, not index-key order, but every consumer
 * (this artifact, the per-module page's index table) expects "08501" before
 * "08504".
 */
export function readIndexes(sem: string): IndexesFile {
  let data = indexesCache.get(sem)
  if (!data) {
    const raw = readJson<IndexesFile>(
      path.join(SRC, "indexes", `${sem}.json`),
      {}
    )
    data = Object.fromEntries(
      Object.entries(raw).map(([code, byKey]) => [
        code,
        Object.fromEntries(
          Object.keys(byKey)
            .sort()
            .map((key) => [key, byKey[key]])
        )
      ])
    )
    indexesCache.set(sem, data)
  }
  return data
}

const examsCache = new Map<string, ExamsFile>()
export function readExams(sem: string): ExamsFile {
  let data = examsCache.get(sem)
  if (!data) {
    data = readJson(path.join(SRC, "exams", `${sem}.json`), {})
    examsCache.set(sem, data)
  }
  return data
}

let allSemsCache: string[] | null = null
function listAllSems(): string[] {
  allSemsCache ??= fs
    .readdirSync(path.join(SRC, "metadata"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
  return allSemsCache
}

let semestersWithOfferingsCache: SemesterEntry[] | null = null
/** Every semester that has at least one offering, newest first. */
export function semestersWithOfferings(): SemesterEntry[] {
  semestersWithOfferingsCache ??= listAllSems()
    .filter((sem) => Object.keys(readMetadata(sem)).length > 0)
    .map(parseSem)
    .sort((a, b) => b.sortKey - a.sortKey)
  return semestersWithOfferingsCache
}

let semestersWithExamsCache: SemesterEntry[] | null = null
/** Every semester that has at least one exam, newest first. */
export function semestersWithExams(): SemesterEntry[] {
  semestersWithExamsCache ??= listAllSems()
    .filter((sem) => Object.keys(readExams(sem)).length > 0)
    .map(parseSem)
    .sort((a, b) => b.sortKey - a.sortKey)
  return semestersWithExamsCache
}

let moduleSemestersCache: Map<string, SemesterEntry[]> | null = null
/**
 * Every code's list of offered semesters, newest first — built by scanning
 * semestersWithOfferings() once. `list[0]` is that module's "current"
 * offering everywhere below, matching sort_key DESC in the old SQL.
 */
function moduleSemestersIndex(): Map<string, SemesterEntry[]> {
  if (moduleSemestersCache) return moduleSemestersCache
  const index = new Map<string, SemesterEntry[]>()
  for (const s of semestersWithOfferings()) {
    for (const code of Object.keys(readMetadata(s.sem))) {
      let list = index.get(code)
      if (!list) index.set(code, (list = []))
      list.push(s)
    }
  }
  moduleSemestersCache = index
  return index
}

export function getModuleSemesters(code: string): SemesterEntry[] {
  return moduleSemestersIndex().get(code) ?? []
}

/**
 * Codes offered in the active/latest semester only — the getStaticPaths
 * subset for the /mods/[module] build. Everything else (~3,200 of the 4,300
 * codes ever offered) renders on demand instead; see
 * src/astro/pages/404.astro.
 */
export function activeOfferingCodes(): string[] {
  const [latest] = semestersWithOfferings()
  return latest ? Object.keys(readMetadata(latest.sem)).sort() : []
}

export interface LatestOffering {
  code: string
  sem: string
  year: string
  semester: string
  raw: RawModule
}

let latestOfferingsCache: LatestOffering[] | null = null
/** Each module's raw record as of its most recent offering, sorted by code. */
export function latestOfferings(): LatestOffering[] {
  if (latestOfferingsCache) return latestOfferingsCache
  const result: LatestOffering[] = []
  for (const [code, sems] of moduleSemestersIndex()) {
    const latest = sems[0]
    const raw = readMetadata(latest.sem)[code]
    if (raw)
      result.push({
        code,
        sem: latest.sem,
        year: latest.year,
        semester: latest.semester,
        raw
      })
  }
  result.sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0))
  latestOfferingsCache = result
  return latestOfferingsCache
}

/**
 * Every offering from `yearCutoff` onwards, excluding each module's current
 * offering — mirrors SITEMAP_VERSIONED_OFFERINGS_SQL (`rn > 1`).
 */
export function versionedOfferings(
  yearCutoff: number
): Array<{ code: string; year: string; semester: string }> {
  const result: Array<{ code: string; year: string; semester: string }> = []
  for (const [code, sems] of moduleSemestersIndex()) {
    for (let i = 1; i < sems.length; i++) {
      const s = sems[i]
      if (Number(s.year) >= yearCutoff)
        result.push({ code, year: s.year, semester: s.semester })
    }
  }
  result.sort((a, b) => {
    if (a.code !== b.code) return a.code < b.code ? -1 : 1
    return sortKeyOf(b.year, b.semester) - sortKeyOf(a.year, a.semester)
  })
  return result
}

function shapeModule(raw: RawModule): DbModule {
  const searchKeys = [...new Set(raw.searchKeys ?? [])]
  const module: DbModule = {
    searchKeys,
    code: raw.code,
    title: raw.title,
    au: raw.au,
    faculty: (deriveFaculty(searchKeys) || "") as DbModule["faculty"],
    categories: deriveCategories(searchKeys) as ModuleType[]
  }
  if (raw.description !== undefined) module.description = raw.description
  if (raw.gradeType !== undefined) module.gradeType = raw.gradeType
  if (raw.notAvailableToProgramme !== undefined) {
    module.notAvailableToProgramme = raw.notAvailableToProgramme
  }
  if (raw.notAvailableToAllProgrammeWith !== undefined) {
    module.notAvailableToAllProgrammeWith = raw.notAvailableToAllProgrammeWith
  }
  if (raw.notAvailableAsBdeueToProgramme !== undefined) {
    module.notAvailableAsBdeueToProgramme = raw.notAvailableAsBdeueToProgramme
  }
  if (raw.notAvailableAsCoreToProgramme !== undefined) {
    module.notAvailableAsCoreToProgramme = raw.notAvailableAsCoreToProgramme
  }
  if (raw.notAvailableAsPeToProgramme !== undefined) {
    module.notAvailableAsPeToProgramme = raw.notAvailableAsPeToProgramme
  }
  if (raw.notOfferedAsBde !== undefined)
    module.notOfferedAsBde = raw.notOfferedAsBde
  if (raw.notOfferedAsUe !== undefined)
    module.notOfferedAsUe = raw.notOfferedAsUe
  if (raw.mutuallyExclusiveWith !== undefined) {
    module.mutuallyExclusiveWith = raw.mutuallyExclusiveWith
  }
  if (raw.extras !== undefined) module.extras = raw.extras
  if (raw.prerequisite !== undefined) module.prerequisite = raw.prerequisite
  return module
}

export function getModuleMetadata(
  code: string,
  year: string,
  semester: string
): DbModule | null {
  const raw = readMetadata(`${year}_${semester}`)[code]
  return raw ? shapeModule(raw) : null
}

// Memoised: every prerendered /mods/[module] page asks for the whole
// semester, and re-deriving faculty/categories for ~4k modules per page was
// ~a third of build time. Callers treat the result as read-only.
const allModuleMetadataCache = new Map<string, Record<string, DbModule>>()
export function getAllModuleMetadata(
  year: string,
  semester: string
): Record<string, DbModule> {
  const sem = `${year}_${semester}`
  let shaped = allModuleMetadataCache.get(sem)
  if (!shaped) {
    shaped = Object.fromEntries(
      Object.entries(readMetadata(sem)).map(([code, raw]) => [
        code,
        shapeModule(raw)
      ])
    )
    allModuleMetadataCache.set(sem, shaped)
  }
  return shaped
}

export function getModuleIndexesData(
  code: string,
  year: string,
  semester: string
): Record<string, Index[]> {
  return readIndexes(`${year}_${semester}`)[code] ?? {}
}

export function getModuleExamData(
  code: string,
  year: string,
  semester: string
): DbExam | null {
  return readExams(`${year}_${semester}`)[code] ?? null
}

export function getSemesterExamsData(
  year: string,
  semester: string
): Record<string, DbExam> {
  return readExams(`${year}_${semester}`)
}

/**
 * Each module's prerequisites as of its most recent offering, plus the
 * inverse edges. Only prerequisite items that resolve to a module code
 * become edges; the rest are free text and are dropped here (unlike the D1
 * path, nothing keeps the free text — this only ever fed the graph).
 * Modules with no edges in either direction are omitted.
 */
export function getPrerequisiteGraph(): Record<string, DbPrerequisiteNode> {
  const info = new Map<string, { title: string; requires: Set<string> }>()
  for (const [code, sems] of moduleSemestersIndex()) {
    const raw = readMetadata(sems[0].sem)[code]
    if (!raw) continue
    const requires = new Set<string>()
    for (const group of raw.prerequisite ?? []) {
      for (const item of group)
        if (MODULE_CODE_RE.test(item)) requires.add(item)
    }
    info.set(code, { title: raw.title, requires })
  }

  const requiredBy = new Map<string, Set<string>>()
  for (const [code, { requires }] of info) {
    for (const req of requires) {
      if (!requiredBy.has(req)) requiredBy.set(req, new Set())
      requiredBy.get(req)!.add(code)
    }
  }

  const graph: Record<string, DbPrerequisiteNode> = {}
  for (const code of Array.from(info.keys()).sort()) {
    const { title, requires } = info.get(code)!
    const by = requiredBy.get(code) ?? new Set<string>()
    if (requires.size > 0 || by.size > 0) {
      graph[code] = {
        title,
        requires: Array.from(requires).sort(),
        requiredBy: Array.from(by).sort()
      }
    }
  }
  return graph
}
