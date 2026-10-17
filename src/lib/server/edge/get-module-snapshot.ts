import { env } from "cloudflare:workers"

import {
  buildModuleTitlesSql,
  LATEST_SEMESTER_SQL,
  MODULE_LATEST_SEM_SQL,
  MODULE_OTHER_SEMESTERS_SQL,
  MODULE_RELATED_SQL,
  MODULE_REQUIRED_BY_SQL,
  MODULE_REQUIRES_SQL,
  OFFERING_EXAM_SQL,
  OFFERING_INDEX_KEYS_SQL,
  OFFERING_PREREQUISITES_SQL,
  OFFERING_SLOTS_SQL,
  OFFERING_SQL
} from "@/lib/server/db/queries"
import { toDbExam, toDbModule, toIndexes } from "@/lib/server/db/shape"
import type {
  DbExamRow,
  DbOfferingRow,
  DbPrerequisiteRow,
  DbSemesterRow,
  DbSlotRow
} from "@/lib/server/db/shape"
import type {
  DbExam,
  DbModule,
  DbPrerequisiteNode
} from "@/lib/server/db/types"

/**
 * Request-time counterpart to src/lib/server/db/repo.ts, for the one route
 * that renders historic module snapshots on-demand rather than prerendering
 * them. repo.ts uses `node:sqlite` against a local file, which Cloudflare
 * Workers cannot load; this one runs the same SQL from
 * src/lib/server/db/queries.ts through the D1 binding.
 *
 * This replaces the previous ASSETS-fetch + KV-slice + self-heal-on-miss
 * arrangement, which existed only because the data lived in whole-semester JSON
 * files (up to ~3MB) that had to be fetched and parsed in full just to read one
 * module. With D1 there is no whole-file read to avoid, so the KV cache, its
 * write-back path, the LRU and the in-flight dedup map all have nothing left to
 * do. The MODULE_DATA namespace itself is untouched and can be re-bound if this
 * needs reverting.
 */
const TITLE_CHUNK = 90

export interface ModuleSnapshot {
  moduleData: DbModule
  indexes: Record<string, Index[]>
  exam: DbExam | null
  isCurrentOffering: boolean
  /** This module's most recent semester; /mods/CODE shows the same data. */
  isLatestOffering: boolean
}

/**
 * The latest semester rarely changes and is the same for every request, so it
 * is memoised for the life of the isolate. Everything else is per-module and
 * indexed, so caching it would only duplicate what D1 already does.
 */
let latestSemPromise: Promise<string | null> | null = null

function getLatestSem(db: D1Database): Promise<string | null> {
  latestSemPromise ??= db
    .prepare(LATEST_SEMESTER_SQL)
    .first<DbSemesterRow>()
    .then((row) => row?.sem ?? null)
    .catch(() => {
      latestSemPromise = null
      return null
    })
  return latestSemPromise
}

export async function getModuleSnapshot(
  _requestUrl: URL,
  code: string,
  year: string,
  semester: string
): Promise<ModuleSnapshot | null> {
  // These come straight off the URL. They are bound as query parameters rather
  // than interpolated, so this is not an injection guard — it rejects
  // nonsense cheaply before spending five D1 round trips on it.
  if (!/^\d{4}$/.test(year) || !/^[12ST]$/.test(semester)) return null
  if (!/^[A-Z0-9]{2,12}$/.test(code)) return null

  const db = env.DB
  if (!db) return null

  const sem = `${year}_${semester}`

  const [
    offering,
    prerequisites,
    indexKeys,
    slots,
    exam,
    latestSem,
    moduleLatest
  ] = await Promise.all([
    db.prepare(OFFERING_SQL).bind(code, sem).first<DbOfferingRow>(),
    db
      .prepare(OFFERING_PREREQUISITES_SQL)
      .bind(code, sem)
      .all<DbPrerequisiteRow>(),
    db
      .prepare(OFFERING_INDEX_KEYS_SQL)
      .bind(code, sem)
      .all<{ index_key: string }>(),
    db.prepare(OFFERING_SLOTS_SQL).bind(code, sem).all<DbSlotRow>(),
    db.prepare(OFFERING_EXAM_SQL).bind(code, sem).first<DbExamRow>(),
    getLatestSem(db),
    db.prepare(MODULE_LATEST_SEM_SQL).bind(code).first<DbSemesterRow>()
  ])

  if (!offering) return null

  return {
    moduleData: toDbModule(offering, prerequisites.results ?? []),
    indexes: toIndexes(
      slots.results ?? [],
      (indexKeys.results ?? []).map((r) => r.index_key)
    ),
    exam: exam ? toDbExam(exam) : null,
    // Derived from the database, not from the portal's semesters.json. The old
    // source was scraped independently of whether any courses had been loaded,
    // so a newly listed but unscraped semester made every module render the
    // "historical snapshot" banner.
    isCurrentOffering: latestSem === sem,
    isLatestOffering: moduleLatest?.sem === sem
  }
}

/**
 * True when an older semester's page shows the same module data, indexes and
 * exam as the module's latest offering. Google folds those into /mods/CODE
 * anyway ("Google chose different canonical"), so they should declare it.
 */
export async function isSameAsLatest(
  code: string,
  snapshot: ModuleSnapshot
): Promise<boolean> {
  const db = env.DB
  if (!db || snapshot.isLatestOffering) return false
  const latest = await db
    .prepare(MODULE_LATEST_SEM_SQL)
    .bind(code)
    .first<DbSemesterRow>()
  if (!latest) return false
  const current = await getModuleSnapshot(
    new URL("http://internal/"),
    code,
    latest.year,
    latest.semester
  )
  if (!current) return false
  const key = (s: ModuleSnapshot) =>
    JSON.stringify([s.moduleData, s.indexes, s.exam])
  return key(current) === key(snapshot)
}

export interface ModuleFullSnapshot extends ModuleSnapshot {
  year: string
  semester: string
  otherSemesters: Array<{ year: string; semester: string }>
  prereqNode: DbPrerequisiteNode | null
  prereqGraph: Record<string, DbPrerequisiteNode>
  related: Array<{ code: string; title: string }>
  /** Prerequisite codes that have a module page, so unknown ones stay plain text. */
  knownCodes: string[]
}

/**
 * Request-time counterpart to /mods/[module]'s build-time data (repo.ts's
 * getModuleCurrentSemester + friends), for module codes outside the active
 * semester and therefore not in its getStaticPaths — see
 * src/astro/pages/404.astro, the route that calls this.
 *
 * Unlike getModuleSnapshot, the caller doesn't know which semester a code
 * was last offered in, so this resolves that first and then fetches
 * everything the /mods/[module] page needs: the offering itself, its other
 * semesters, and a two-hop slice of the prerequisite graph (this module's
 * direct edges plus their titles) rather than the whole graph, which is
 * only ever built from JSON at build time.
 */
export async function getLatestModuleSnapshot(
  code: string
): Promise<ModuleFullSnapshot | null> {
  if (!/^[A-Z0-9]{2,12}$/.test(code)) return null

  const db = env.DB
  if (!db) return null

  const latest = await db
    .prepare(MODULE_LATEST_SEM_SQL)
    .bind(code)
    .first<DbSemesterRow>()
  if (!latest) return null

  const snapshot = await getModuleSnapshot(
    new URL("http://internal/"),
    code,
    latest.year,
    latest.semester
  )
  if (!snapshot) return null

  const [otherSemesters, requiresRows, requiredByRows, relatedRows] =
    await Promise.all([
      db
        .prepare(MODULE_OTHER_SEMESTERS_SQL)
        .bind(code, latest.sem)
        .all<{ year: string; semester: string }>(),
      db
        .prepare(MODULE_REQUIRES_SQL)
        .bind(code, latest.sem)
        .all<{ code: string }>(),
      db.prepare(MODULE_REQUIRED_BY_SQL).bind(code).all<{ code: string }>(),
      db
        .prepare(MODULE_RELATED_SQL)
        .bind(latest.sem, `${code.slice(0, 2)}%`, code)
        .all<{ code: string; title: string }>()
    ])

  const requires = (requiresRows.results ?? []).map((r) => r.code).sort()
  const requiredBy = (requiredByRows.results ?? []).map((r) => r.code).sort()

  let prereqGraph: Record<string, DbPrerequisiteNode> = {}
  let prereqNode: DbPrerequisiteNode | null = null
  let knownCodes: string[] = []

  if (requires.length > 0 || requiredBy.length > 0) {
    const neighbours = Array.from(new Set([...requires, ...requiredBy]))
    // D1 caps bound parameters per query (100), and a module like HL1001 is
    // required by far more than that, so look titles up in chunks.
    const chunks: string[][] = []
    for (let i = 0; i < neighbours.length; i += TITLE_CHUNK) {
      chunks.push(neighbours.slice(i, i + TITLE_CHUNK))
    }
    const titleRows = (
      await Promise.all(
        chunks.map((chunk) =>
          db
            .prepare(buildModuleTitlesSql(chunk.length))
            .bind(...chunk)
            .all<{ code: string; title: string }>()
        )
      )
    ).flatMap((r) => r.results ?? [])
    knownCodes = titleRows.map((r) => r.code)

    prereqGraph = Object.fromEntries(
      titleRows.map((r) => [
        r.code,
        { title: r.title, requires: [], requiredBy: [] }
      ])
    )
    prereqNode = { title: snapshot.moduleData.title, requires, requiredBy }
    prereqGraph[code] = prereqNode
  }

  const related = (relatedRows.results ?? [])
    .sort((a, b) => parseInt(a.code.slice(2)) - parseInt(b.code.slice(2)))
    .slice(0, 9)

  return {
    ...snapshot,
    year: latest.year,
    semester: latest.semester,
    otherSemesters: otherSemesters.results ?? [],
    prereqNode,
    prereqGraph,
    related,
    knownCodes
  }
}
