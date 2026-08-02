import type { DbModule } from "@/lib/server/db/types"

/** Head title/description for a module's "current offering" page — shared by the static build and the on-demand fallback so they read identically. */
export function buildModuleMeta(code: string, moduleData: DbModule) {
  const trimmed = moduleData.description?.trim()
  const description = trimmed
    ? `${trimmed.slice(0, 100)}${trimmed.length > 100 ? "…" : ""}`
    : `${code} is a ${moduleData.au} AU NTU module. Check index schedules, class times, exam dates, venues, and prerequisites on NTUMods.`

  return {
    title: `${code} ${moduleData.title} (${moduleData.au} AU) | NTUMods`,
    description
  }
}
