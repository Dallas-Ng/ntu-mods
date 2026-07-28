import { env, waitUntil } from "cloudflare:workers"

import type { ApiExam } from "@/lib/server/get-module-exam-data"
import type { ApiModule } from "@/lib/server/get-module-metadata"

// Runtime counterpart to src/lib/server/get-module-*.ts (which use node:fs
// and are build-time-only — Cloudflare Workers has no filesystem). Reads the
// same JSON files via the ASSETS binding instead, for the one route that
// renders historic module snapshots on-demand rather than prerendering them.
export interface ModuleSnapshot {
  moduleData: ApiModule
  indexes: Record<string, Index[]>
  exam: ApiExam | null
  isCurrentOffering: boolean
}

// Semester data files (up to ~3MB for indexes) are shared across every
// module offered that term. Without caching, rendering N historic snapshot
// pages for the same semester re-fetches and re-parses the same file N
// times on a warm isolate. Mirrors the fileCache pattern in
// get-module-indexes-data.ts, adapted for the edge ASSETS-fetch path.
// Capped (not per-semester unbounded) since a warm isolate can live across
// many distinct semesters — an unbounded cache of ~4MB-per-semester entries
// would eventually exhaust the 128MB isolate memory limit.
const CACHE_LIMIT = 6
const cache = new Map<string, unknown>()
const pending = new Map<string, Promise<unknown>>()

async function fetchJson<T>(
  requestUrl: URL,
  relativePath: string
): Promise<T | null> {
  if (cache.has(relativePath)) return cache.get(relativePath) as T | null

  const inFlight = pending.get(relativePath) as Promise<T | null> | undefined
  if (inFlight) return inFlight

  const promise = (async () => {
    const assetUrl = new URL(relativePath, requestUrl)
    const res = await env.ASSETS.fetch(assetUrl)
    const result = res.ok ? ((await res.json()) as T) : null

    if (cache.size >= CACHE_LIMIT) {
      const oldestKey = cache.keys().next().value
      if (oldestKey !== undefined) cache.delete(oldestKey)
    }
    cache.set(relativePath, result)
    pending.delete(relativePath)
    return result
  })()

  pending.set(relativePath, promise)
  return promise
}

// Reads a single module's slice straight from KV instead of fetching and
// parsing the whole semester file just to key into it. Falls back to the
// whole-file path — via wholeFileFallback — when the binding isn't
// configured (local dev) or the key hasn't been populated yet.
//
// On a miss, self-heals by writing the module the fallback just parsed back
// to KV (fire-and-forget via waitUntil, doesn't block the response). Every
// module/year/semester combo therefore only ever pays the full-file parse
// cost once, on its first ever request — no separate population step to
// remember when the scraper adds a new semester. Historic snapshot data is
// immutable in practice (past semesters don't get re-scraped), so a written
// key never goes stale; scripts/populate-module-kv.mjs remains available to
// force-refresh KV in bulk if that assumption is ever wrong.
async function fetchModuleField<T>(
  kvPrefix: "metadata" | "indexes",
  year: string,
  semester: string,
  code: string,
  wholeFileFallback: () => Promise<T | null>
): Promise<T | null> {
  const kvKey = `${kvPrefix}:${year}_${semester}:${code}`

  if (env.MODULE_DATA) {
    try {
      const fromKv = await env.MODULE_DATA.get<T>(kvKey, "json")
      if (fromKv !== null) return fromKv
    } catch {
      // KV unavailable/erroring — fall through to the whole-file path below.
    }
  }

  const value = await wholeFileFallback()

  if (value !== null && env.MODULE_DATA) {
    const kv = env.MODULE_DATA
    waitUntil(
      kv.put(kvKey, JSON.stringify(value)).catch(() => {
        // Best-effort backfill — a failed write just means this combo keeps
        // paying the parse cost until a later request succeeds.
      })
    )
  }

  return value
}

export async function getModuleSnapshot(
  requestUrl: URL,
  code: string,
  year: string,
  semester: string
): Promise<ModuleSnapshot | null> {
  // year/semester come straight off the URL and are interpolated into an asset
  // path below. URL resolution collapses "..", so an unvalidated segment could
  // point the fetch at an unrelated asset whose body then fails to parse as
  // the expected shape. Reject anything that isn't a real term identifier.
  if (!/^\d{4}$/.test(year) || !/^[12ST]$/.test(semester)) return null
  if (!/^[A-Z0-9]{2,12}$/.test(code)) return null

  const [moduleData, indexes, examsFile, semesters] = await Promise.all([
    fetchModuleField<ApiModule>("metadata", year, semester, code, async () => {
      const metadata = await fetchJson<Record<string, ApiModule>>(
        requestUrl,
        `/data/api/metadata/${year}_${semester}.json`
      )
      return metadata?.[code] ?? null
    }),
    fetchModuleField<Record<string, Index[]>>(
      "indexes",
      year,
      semester,
      code,
      async () => {
        const indexesFile = await fetchJson<
          Record<string, Record<string, Index[]>>
        >(requestUrl, `/data/api/indexes/${year}_${semester}.json`)
        return indexesFile?.[code] ?? null
      }
    ),
    fetchJson<Record<string, ApiExam>>(
      requestUrl,
      `/data/api/exams/${year}_${semester}.json`
    ),
    fetchJson<Array<{ code: string }>>(requestUrl, "/data/api/semesters.json")
  ])

  if (!moduleData) return null

  const latestCode = semesters?.[0]?.code
  const [latestYear, latestSemester] = latestCode?.split(";") ?? []
  const isCurrentOffering = latestYear === year && latestSemester === semester

  return {
    moduleData: { ...moduleData, code },
    indexes: indexes ?? {},
    exam: examsFile?.[code] ?? null,
    isCurrentOffering
  }
}
