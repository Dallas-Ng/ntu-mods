import type { AllModule, ModsGroupBy } from "@/types/mods"
import { MODULE_CATEGORY, MODULE_FACULTY } from "@/lib/constants"
import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleFaculty } from "@/lib/get-module-faculty"
import type { SeasonIndexes } from "@/hooks/use-season-indexes"

export const CODE_QUERY_RE = /^[a-z]{2,4}\d*/i

export const TYPE_PRIORITY: ModuleType[] = [
  "CNY",
  "USP",
  "GERP",
  "MLOAD",
  "GLOAD",
  "CORE"
]

export function getGroupKey(module: AllModule, groupBy: ModsGroupBy): string {
  switch (groupBy) {
    case "level":
      return module.code.slice(2, 3)
    case "au":
      return module.au ?? "?"
    case "faculty":
      return getModuleFaculty(module.code, module.searchKeys ?? []) || "OTHER"
    case "type": {
      const cats = getModuleCategories(module.searchKeys ?? [])
      if (cats.length === 0) return "OTHER"
      return TYPE_PRIORITY.find((p) => cats.includes(p)) ?? cats[0]
    }
    default:
      return ""
  }
}

export function getGroupLabel(key: string, groupBy: ModsGroupBy): string {
  switch (groupBy) {
    case "level":
      return `Level ${key}`
    case "au":
      return `${key} AU`
    case "faculty":
      return `${MODULE_FACULTY[key as ModuleFaculty] ?? key} (${key})`
    case "type":
      return MODULE_CATEGORY[key as ModuleType] ?? key
    default:
      return key
  }
}

export function groupModules(modules: AllModule[], groupBy: ModsGroupBy) {
  const map = new Map<string, AllModule[]>()
  for (const m of modules) {
    const key = getGroupKey(m, groupBy)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }
  const entries = Array.from(map.entries()).map(([key, mods]) => ({
    key,
    label: getGroupLabel(key, groupBy),
    modules: mods
  }))
  if (groupBy === "level" || groupBy === "au") {
    entries.sort((a, b) =>
      a.key.localeCompare(b.key, undefined, { numeric: true })
    )
  } else {
    entries.sort((a, b) => a.label.localeCompare(b.label))
  }
  return entries
}

export function filterModules(
  modules: AllModule[],
  opts: {
    searchTerm: string
    moduleType: string
    moduleFaculty: string
    moduleLevel: string
    currentOnly: boolean
    favouritesOnly?: boolean
    favouriteModules?: string[]
    allowedDays?: number[]
    timeStart?: number
    timeEnd?: number
    indexes?: SeasonIndexes
  }
): AllModule[] {
  let filtered = modules

  if (opts.currentOnly) {
    filtered = filtered.filter((m) => m.isCurrentSemester)
  }

  if (opts.favouritesOnly && opts.favouriteModules) {
    filtered = filtered.filter((m) => opts.favouriteModules!.includes(m.code))
  }

  if (opts.moduleType !== "all") {
    filtered = filtered.filter((m) =>
      getModuleCategories(m.searchKeys ?? []).includes(
        opts.moduleType as ModuleType
      )
    )
  }

  if (opts.moduleFaculty !== "all") {
    filtered = filtered.filter(
      (m) => getModuleFaculty(m.code, m.searchKeys ?? []) === opts.moduleFaculty
    )
  }

  if (opts.moduleLevel !== "all") {
    filtered = filtered.filter((m) => m.code.slice(2, 3) === opts.moduleLevel)
  }

  if (opts.allowedDays && opts.allowedDays.length > 0 && opts.indexes) {
    filtered = filtered.filter((m) => {
      const mi = opts.indexes![m.code]
      if (!mi) return true
      return Object.values(mi).some((slots) =>
        slots.every((s) => opts.allowedDays!.includes(s.day))
      )
    })
  }

  if (
    (opts.timeStart !== undefined || opts.timeEnd !== undefined) &&
    opts.indexes
  ) {
    filtered = filtered.filter((m) => {
      const mi = opts.indexes![m.code]
      if (!mi) return true
      return Object.values(mi).some((slots) =>
        slots.every((s) => {
          const [startStr, endStr] = s.time.split("-")
          const st = parseInt(startStr)
          const en = parseInt(endStr)
          return (
            (opts.timeStart === undefined || st >= opts.timeStart) &&
            (opts.timeEnd === undefined || en <= opts.timeEnd)
          )
        })
      )
    })
  }

  if (opts.searchTerm) {
    const q = opts.searchTerm.toLowerCase()
    if (CODE_QUERY_RE.test(q)) {
      const codeMatches = filtered.filter((m) =>
        m.code.toLowerCase().includes(q)
      )
      const titleMatches = filtered.filter(
        (m) =>
          !m.code.toLowerCase().includes(q) && m.title.toLowerCase().includes(q)
      )
      filtered = [...codeMatches, ...titleMatches]
    } else {
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
      )
    }
  }

  return filtered
}
