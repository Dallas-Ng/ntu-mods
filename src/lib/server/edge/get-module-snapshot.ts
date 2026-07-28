import { env } from "cloudflare:workers"

import {
  LATEST_SEMESTER_SQL,
  OFFERING_EXAM_SQL,
  OFFERING_INDEX_KEYS_SQL,
  OFFERING_PREREQUISITES_SQL,
  OFFERING_SLOTS_SQL,
  OFFERING_SQL
} from "@/lib/server/db/queries"
import { toApiExam, toApiModule, toIndexes } from "@/lib/server/db/shape"
import type {
  ExamRow,
  OfferingRow,
  PrerequisiteRow,
  SemesterRow,
  SlotRow
} from "@/lib/server/db/shape"
import type { ApiExam } from "@/lib/server/get-module-exam-data"
import type { ApiModule } from "@/lib/server/get-module-metadata"

/**
 * Request-time counterpart to src/lib/server/get-module-*.ts, for the one route
 * that renders historic module snapshots on-demand rather than prerendering
 * them. Those readers use `node:sqlite` against a local file, which Cloudflare
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
export interface ModuleSnapshot {
  moduleData: ApiModule
  indexes: Record<string, Index[]>
  exam: ApiExam | null
  isCurrentOffering: boolean
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
    .first<SemesterRow>()
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

  const [offering, prerequisites, indexKeys, slots, exam, latestSem] =
    await Promise.all([
      db.prepare(OFFERING_SQL).bind(code, sem).first<OfferingRow>(),
      db
        .prepare(OFFERING_PREREQUISITES_SQL)
        .bind(code, sem)
        .all<PrerequisiteRow>(),
      db
        .prepare(OFFERING_INDEX_KEYS_SQL)
        .bind(code, sem)
        .all<{ index_key: string }>(),
      db.prepare(OFFERING_SLOTS_SQL).bind(code, sem).all<SlotRow>(),
      db.prepare(OFFERING_EXAM_SQL).bind(code, sem).first<ExamRow>(),
      getLatestSem(db)
    ])

  if (!offering) return null

  return {
    moduleData: toApiModule(offering, prerequisites.results ?? []),
    indexes: toIndexes(
      slots.results ?? [],
      (indexKeys.results ?? []).map((r) => r.index_key)
    ),
    exam: exam ? toApiExam(exam) : null,
    // Derived from the database, not from the portal's semesters.json. The old
    // source was scraped independently of whether any courses had been loaded,
    // so a newly listed but unscraped semester made every module render the
    // "historical snapshot" banner.
    isCurrentOffering: latestSem === sem
  }
}
