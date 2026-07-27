import { env } from "cloudflare:workers"

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

async function fetchJson<T>(
  requestUrl: URL,
  relativePath: string
): Promise<T | null> {
  const assetUrl = new URL(relativePath, requestUrl)
  const res = await env.ASSETS.fetch(assetUrl)
  if (!res.ok) return null
  return (await res.json()) as T
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

  const [metadata, indexesFile, examsFile, semesters] = await Promise.all([
    fetchJson<Record<string, ApiModule>>(
      requestUrl,
      `/data/api/metadata/${year}_${semester}.json`
    ),
    fetchJson<Record<string, Record<string, Index[]>>>(
      requestUrl,
      `/data/api/indexes/${year}_${semester}.json`
    ),
    fetchJson<Record<string, ApiExam>>(
      requestUrl,
      `/data/api/exams/${year}_${semester}.json`
    ),
    fetchJson<Array<{ code: string }>>(requestUrl, "/data/api/semesters.json")
  ])

  const moduleData = metadata?.[code]
  if (!moduleData) return null

  const latestCode = semesters?.[0]?.code
  const [latestYear, latestSemester] = latestCode?.split(";") ?? []
  const isCurrentOffering = latestYear === year && latestSemester === semester

  return {
    moduleData: { ...moduleData, code },
    indexes: indexesFile?.[code] ?? {},
    exam: examsFile?.[code] ?? null,
    isCurrentOffering
  }
}
