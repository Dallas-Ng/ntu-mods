import type { AllModule } from "@/types/mods"
import { filterModules } from "@/lib/filter-modules"

// Pure helpers shared by the browser WebMCP handlers and the worker's /mcp
// handlers, so both search, filter and describe data the same way.

export const DAYS = [
  "Online/TBA",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun"
]

export const describeSlot = (slot: Index) => ({
  type: slot.isCustom ? slot.remarks : slot.type,
  group: slot.group,
  day: DAYS[slot.day] ?? "Online/TBA",
  time: slot.day ? slot.time : "no fixed time",
  venue: slot.venue,
  remarks: slot.isCustom ? "" : slot.remarks
})

/** "2026-11-23" or "23 Nov 2026" -> "23 november 2026", the casing list_exams compares in. */
export function normaliseDate(value: string): string {
  const v = value.trim()
  if (!v) return ""
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (iso) {
    const month = new Date(
      Date.UTC(2000, Number(iso[2]) - 1, 1)
    ).toLocaleString("en-GB", {
      month: "long",
      timeZone: "UTC"
    })
    return `${Number(iso[3])} ${month} ${iso[1]}`.toLowerCase()
  }
  return v.toLowerCase()
}

export interface SearchArgs {
  query: string
  category: string
  school: string
  level: string
  au?: number
  currentOnly: boolean
  limit: number
}

/**
 * search_modules for the browser and for /mcp. `base` prefixes the module URL:
 * empty in the page, the site origin for agents that are not on it.
 */
export function searchModuleList(
  modules: AllModule[],
  args: SearchArgs,
  base = ""
) {
  let results = filterModules(modules, {
    searchTerm: args.query,
    moduleType: args.category,
    moduleFaculty: args.school,
    moduleLevel: args.level,
    currentOnly: args.currentOnly
  })
  if (args.au !== undefined) {
    results = results.filter((m) => parseFloat(m.au) === args.au)
  }
  return {
    total: results.length,
    shown: Math.min(results.length, args.limit),
    modules: results.slice(0, args.limit).map((m) => ({
      code: m.code,
      title: m.title,
      au: parseFloat(m.au),
      school: m.faculty || null,
      categories: m.categories ?? [],
      offeredThisSemester: Boolean(m.isCurrentSemester),
      lastOffered:
        m.latestYear && m.latestSemester
          ? `${m.latestYear};${m.latestSemester}`
          : null,
      url: `${base}/mods/${m.code}`
    }))
  }
}

/** list_exams: exams whose code or name contains `query`, optionally on one date. */
export function filterExams(
  exams: Exam[],
  args: { query: string; date: string; limit: number }
) {
  const query = args.query.trim().toLowerCase()
  const date = normaliseDate(args.date)
  const matches = exams.filter(
    (e) =>
      (!query ||
        e.key.toLowerCase().includes(query) ||
        e.name.toLowerCase().includes(query)) &&
      (!date || e.date.toLowerCase() === date)
  )
  return { total: matches.length, exams: matches.slice(0, args.limit) }
}
