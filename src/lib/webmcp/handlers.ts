// The code behind each WebMCP tool in definitions.ts. Runs in the browser and
// goes through the same store, data files and pure helpers the UI uses, so an
// agent can do nothing a user could not do by clicking.

import SEMESTERS from "@/data/api/semesters.json"
import { useBoundState } from "@/state/bound.state"

import { classFor, GRADES, planBands, projectedCgpa } from "@/lib/cgpa"
import {
  customCourseIdFromKey,
  customCourseModuleKey,
  isCustomCourseKey
} from "@/lib/custom-course-colors"
import { customCoursesToAllIndexes } from "@/lib/custom-course-to-index"
import { filterModules } from "@/lib/filter-modules"
import {
  diagnoseConstraints,
  generateCombinations,
  timeslotsOverlap
} from "@/lib/generate-timetable-combinations"
import { DEFAULT_GENERATION_CONFIG } from "@/lib/generation-config"
import { getIcs } from "@/lib/get-ics"
import { resolveBestIndex } from "@/lib/resolve-best-index"
import {
  LATEST_SEMESTER_LABEL,
  latestSemester,
  latestYear
} from "@/lib/semesters"
import {
  buildShareLink,
  decodeTextBundle,
  encodeTextBundle
} from "@/lib/timetable-share"
import { fetchAllModules } from "@/hooks/use-all-modules"
import { fetchSeasonExams } from "@/hooks/use-season-exams"
import { fetchSeasonIndexes } from "@/hooks/use-season-indexes"

import { ToolError, type ToolHandler, type WebMcpAgent } from "./core"
import type { WebMcpToolName } from "./definitions"

// ─── small helpers ──────────────────────────────────────────────────────────

type Args = Record<string, unknown>

const DAYS = ["Online/TBA", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MODULE_CODE = /^[A-Z0-9]{2,12}$/
const PLAN_COUNT = 5

const store = () => useBoundState.getState()

const moduleCode = (args: Args, key = "code"): string => {
  const value = String(args[key] ?? "")
    .trim()
    .toUpperCase()
  if (!MODULE_CODE.test(value)) {
    throw new ToolError(`"${String(args[key])}" is not a valid module code.`)
  }
  return value
}

/** Zero-based plan index; the active plan when the caller names none. */
const planOf = (args: Args): number => {
  if (args.plan === undefined) return store().timetableIndex
  const plan = Number(args.plan)
  if (!Number.isInteger(plan) || plan < 1 || plan > PLAN_COUNT) {
    throw new ToolError(`plan must be between 1 and ${PLAN_COUNT}.`)
  }
  return plan - 1
}

const semesterOf = (args: Args) => {
  const hasYear = args.year !== undefined
  const hasSemester = args.semester !== undefined
  if (hasYear !== hasSemester) {
    throw new ToolError(
      "Pass both year and semester, or neither for the latest."
    )
  }
  const year = String(args.year ?? latestYear)
  const semester = String(args.semester ?? latestSemester)
  if (!/^\d{4}$/.test(year) || !/^[12ST]$/.test(semester)) {
    throw new ToolError(
      "year must be like 2026 and semester one of 1, 2, S, T."
    )
  }
  return {
    year,
    semester,
    isLatest: year === latestYear && semester === latestSemester
  }
}

const describeSlot = (slot: Index) => ({
  type: slot.isCustom ? slot.remarks : slot.type,
  group: slot.group,
  day: DAYS[slot.day] ?? "Online/TBA",
  time: slot.day ? slot.time : "no fixed time",
  venue: slot.venue,
  remarks: slot.isCustom ? "" : slot.remarks
})

const hasFixedTime = (slot: Index) =>
  slot.day > 0 && /^\d{4}-\d{4}$/.test(slot.time)

/** Ask the user before something destructive; the agent cannot answer for them. */
async function confirmWithUser(message: string, agent?: WebMcpAgent) {
  const ask = async () => window.confirm(message)
  const ok = agent?.requestUserInteraction
    ? await agent.requestUserInteraction(ask)
    : await ask()
  if (!ok) throw new ToolError("The user declined, so nothing was changed.")
}

const toMinutes = (hhmm: number) => Math.floor(hhmm / 100) * 60 + (hhmm % 100)

const isValidHhmm = (value: unknown): value is number =>
  Number.isInteger(value) &&
  (value as number) >= 0 &&
  (value as number) <= 2359 &&
  (value as number) % 100 < 60

// ─── data ───────────────────────────────────────────────────────────────────

const loadModules = fetchAllModules
const loadLatestIndexes = () => fetchSeasonIndexes(latestYear, latestSemester)

async function requireOffered(code: string) {
  const [modules, indexes] = await Promise.all([
    loadModules(),
    loadLatestIndexes()
  ])
  const found = modules.find((m) => m.code === code)
  if (!found) throw new ToolError(`No module ${code} exists in the NTU data.`)
  const moduleIndexes = indexes[code]
  if (!moduleIndexes || Object.keys(moduleIndexes).length === 0) {
    throw new ToolError(
      `${code} (${found.title}) is not offered in ${LATEST_SEMESTER_LABEL}.`
    )
  }
  return { module: found, moduleIndexes, indexes }
}

async function fetchModuleRecord(code: string) {
  const res = await fetch(`/api/modules/${code}`)
  if (res.status === 404)
    throw new ToolError(`No module ${code} exists in the NTU data.`)
  if (!res.ok)
    throw new ToolError("The module service is unavailable. Try again shortly.")
  return res.json()
}

// ─── plan model ─────────────────────────────────────────────────────────────

interface PlanEntry {
  key: string
  code: string
  title: string
  au: number
  isCustom: boolean
  indexKey: string
  slots: Index[]
}

async function loadPlan(planIndex: number) {
  const state = store()
  const timetable = state.timetables[planIndex] ?? {}
  const customCourses = state.customCourses[planIndex] ?? []
  const [modules, indexes] = await Promise.all([
    loadModules(),
    loadLatestIndexes()
  ])
  const byCode = new Map(modules.map((m) => [m.code, m]))
  const customIndexes = customCoursesToAllIndexes(customCourses)

  const entries: PlanEntry[] = Object.entries(timetable).map(
    ([code, indexKey]) => ({
      key: code,
      code,
      title: byCode.get(code)?.title ?? code,
      au: parseFloat(byCode.get(code)?.au ?? "0") || 0,
      isCustom: false,
      indexKey,
      slots: indexes[code]?.[indexKey] ?? []
    })
  )

  for (const course of customCourses) {
    const key = customCourseModuleKey(course.id)
    entries.push({
      key,
      code: course.name,
      title: course.name,
      au: 0,
      isCustom: true,
      indexKey: course.selectedIndexId,
      slots: customIndexes[key]?.[course.selectedIndexId] ?? []
    })
  }

  return {
    state,
    timetable,
    customCourses,
    customIndexes,
    entries,
    indexes,
    byCode
  }
}

function findClashes(entries: PlanEntry[]) {
  const clashes: {
    between: [string, string]
    day: string
    times: [string, string]
  }[] = []
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const seen = new Set<string>()
      for (const a of entries[i].slots.filter(hasFixedTime)) {
        for (const b of entries[j].slots.filter(hasFixedTime)) {
          const id = `${a.day}|${a.time}|${b.time}`
          if (seen.has(id) || !timeslotsOverlap(a, b)) continue
          seen.add(id)
          clashes.push({
            between: [entries[i].code, entries[j].code],
            day: DAYS[a.day],
            times: [a.time, b.time]
          })
        }
      }
    }
  }
  return clashes
}

/** "9.00 am" -> minutes since midnight; NaN if the format is unfamiliar. */
const examMinutes = (value: string) => {
  const m = /^(\d{1,2})[.:](\d{2})\s*(am|pm)$/i.exec(value.trim())
  if (!m) return NaN
  return (
    ((Number(m[1]) % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0)) * 60 +
    Number(m[2])
  )
}

async function findExamClashes(codes: string[]) {
  const exams = await fetchSeasonExams(latestYear, latestSemester)
  const mine = codes.flatMap((code) => (exams[code] ? [exams[code]] : []))
  const clashes: { between: [string, string]; date: string }[] = []
  for (let i = 0; i < mine.length; i++) {
    for (let j = i + 1; j < mine.length; j++) {
      const a = mine[i]
      const b = mine[j]
      if (a.date !== b.date) continue
      const [aS, aE, bS, bE] = [
        a.start_time,
        a.end_time,
        b.start_time,
        b.end_time
      ].map(examMinutes)
      if (aS < bE && bS < aE)
        clashes.push({ between: [a.key, b.key], date: a.date })
    }
  }
  return { exams: mine, clashes }
}

async function describePlan(planIndex: number) {
  const plan = await loadPlan(planIndex)
  const { exams, clashes: examClashes } = await findExamClashes(
    plan.entries.filter((e) => !e.isCustom).map((e) => e.code)
  )
  const examOf = new Map(exams.map((e) => [e.key, e]))
  const locked = plan.state.lockedModules

  return {
    plan: planIndex + 1,
    isActivePlan: planIndex === plan.state.timetableIndex,
    semester: LATEST_SEMESTER_LABEL,
    totalAu: plan.entries.reduce((sum, e) => sum + e.au, 0),
    modules: plan.entries
      .filter((e) => !e.isCustom)
      .map((e) => ({
        code: e.code,
        title: e.title,
        au: e.au,
        index: e.indexKey,
        locked: locked.includes(e.code),
        slots: e.slots.map(describeSlot),
        exam: examOf.has(e.code)
          ? {
              date: examOf.get(e.code)!.date,
              time: `${examOf.get(e.code)!.start_time} to ${examOf.get(e.code)!.end_time}`
            }
          : null,
        note:
          e.slots.length === 0
            ? `Not offered in ${LATEST_SEMESTER_LABEL}.`
            : undefined
      })),
    customBlocks: plan.entries
      .filter((e) => e.isCustom)
      .map((e) => ({
        id: customCourseIdFromKey(e.key),
        name: e.title,
        slots: e.slots.map(describeSlot)
      })),
    classClashes: findClashes(plan.entries),
    examClashes
  }
}

// ─── mutations ──────────────────────────────────────────────────────────────

function occupiedByCustomBlocks(
  customIndexes: Record<string, Indexes>,
  courses: CustomCourse[]
) {
  return courses.flatMap(
    (c) => customIndexes[customCourseModuleKey(c.id)]?.[c.selectedIndexId] ?? []
  )
}

async function addModule(
  code: string,
  indexKey: string | undefined,
  planIndex: number
) {
  const { moduleIndexes, indexes } = await requireOffered(code)
  const plan = await loadPlan(planIndex)

  let chosen = indexKey
  if (chosen !== undefined && !moduleIndexes[chosen]) {
    throw new ToolError(
      `${code} has no index ${chosen}. Valid: ${Object.keys(moduleIndexes).slice(0, 40).join(", ")}.`
    )
  }
  chosen ??= resolveBestIndex(
    moduleIndexes,
    plan.timetable,
    indexes,
    occupiedByCustomBlocks(plan.customIndexes, plan.customCourses)
  )

  const others = plan.entries.filter((e) => e.code !== code)
  const probe: PlanEntry = {
    key: code,
    code,
    title: code,
    au: 0,
    isCustom: false,
    indexKey: chosen,
    slots: moduleIndexes[chosen]
  }
  const clashesWith = findClashes([probe, ...others])
    .filter((c) => c.between[0] === code)
    .map((c) => c.between[1])

  store().updateTimetable({ ...plan.timetable, [code]: chosen }, planIndex)
  return {
    code,
    index: chosen,
    plan: planIndex + 1,
    clashesWith: [...new Set(clashesWith)]
  }
}

function sanitiseGenerationConfig(input: unknown): Partial<GenerationConfig> {
  if (!input || typeof input !== "object") return {}
  const c = input as Record<string, unknown>
  const out: Partial<GenerationConfig> = {}
  const timeWindow = (w: unknown) => {
    const o = w as { day?: number; startTime?: number; endTime?: number }
    if (
      !Number.isInteger(o?.day) ||
      !isValidHhmm(o?.startTime) ||
      !isValidHhmm(o?.endTime) ||
      toMinutes(o.endTime) <= toMinutes(o.startTime)
    ) {
      throw new ToolError(
        "Each time window needs day, startTime and a later endTime."
      )
    }
    return { day: o.day!, startTime: o.startTime, endTime: o.endTime }
  }
  for (const key of ["dayStartTime", "dayEndTime"] as const) {
    if (c[key] === undefined) continue
    if (!isValidHhmm(c[key]))
      throw new ToolError(`${key} must be an HHMM time.`)
    out[key] = c[key] as number
  }
  for (const key of [
    "maxConsecutiveSlots",
    "minGapBetweenClasses",
    "maxDailyHours"
  ] as const) {
    if (c[key] === undefined) continue
    if (typeof c[key] !== "number" || (c[key] as number) < 0) {
      throw new ToolError(`${key} must be a non-negative number.`)
    }
    out[key] = c[key] as number
  }
  if (c.loadPreference !== undefined) {
    if (c.loadPreference !== "compact" && c.loadPreference !== "spread") {
      throw new ToolError('loadPreference must be "compact" or "spread".')
    }
    out.loadPreference = c.loadPreference
  }
  if (c.preferredDayOrder !== undefined) {
    if (
      !["front-load", "back-load", "none"].includes(
        c.preferredDayOrder as string
      )
    ) {
      throw new ToolError(
        "preferredDayOrder must be front-load, back-load or none."
      )
    }
    out.preferredDayOrder =
      c.preferredDayOrder as GenerationConfig["preferredDayOrder"]
  }
  if (Array.isArray(c.lunchBreaks))
    out.lunchBreaks = c.lunchBreaks.map(timeWindow)
  if (Array.isArray(c.blacklistedTimeslots))
    out.blacklistedTimeslots = c.blacklistedTimeslots.map(timeWindow)
  if (Array.isArray(c.preferredFreeDays)) {
    out.preferredFreeDays = c.preferredFreeDays.filter(
      (d): d is number => Number.isInteger(d) && d >= 1 && d <= 7
    )
  }
  if (Array.isArray(c.skippableTypes)) {
    out.skippableTypes = c.skippableTypes.filter((t): t is IndexType =>
      ["LEC", "TUT", "LAB", "SEM", "DES", "PRJ"].includes(t as string)
    )
  }
  if (Array.isArray(c.avoidBackToBackTypes)) {
    out.avoidBackToBackTypes = c.avoidBackToBackTypes.filter(
      (p): p is [IndexType, IndexType] => Array.isArray(p) && p.length === 2
    )
  }
  return out
}

// ─── handlers ───────────────────────────────────────────────────────────────

const PAGES = [
  [
    "/timetable",
    "Timetable planner: add modules, compare indexes, detect clashes, generate timetables, share and export."
  ],
  [
    "/mods",
    "Module browser: search and filter every NTU module, with a page per module."
  ],
  ["/exams", "Exam schedule for the current semester."],
  ["/tools", "Student tools: CGPA planner, FGO optimiser, wallpaper maker."],
  [
    "/tools/cgpa-planner",
    "Work out the average grade needed for each honours class."
  ],
  [
    "/tools/fgo-optimiser",
    "Pick modules for the Flexible Grading Option from a transcript PDF."
  ],
  ["/articles", "Guides on STARS, planning, honours and FGO."],
  ["/links", "Student portals: STARS, NTULearn, degree audit and more."],
  ["/faq", "Frequently asked questions."],
  ["/changelog", "What changed and when."]
] as const

const handlers: Record<WebMcpToolName, ToolHandler> = {
  get_site_info: async () => {
    const modules = await loadModules()
    return {
      name: "NTUMods",
      description:
        "Free, independent timetable planner, module browser and exam schedule for NTU Singapore students. Not affiliated with NTU. No account needed; plans are stored in the browser.",
      currentSemester: LATEST_SEMESTER_LABEL,
      modulesThisSemester: modules.filter((m) => m.isCurrentSemester).length,
      limits: [
        "No live index vacancies and no registration: students still register on STARS.",
        "Exam data has dates and times but no venues.",
        "Prerequisites are as scraped from NTU and may be free text."
      ],
      pages: PAGES.map(([path, about]) => ({ path, about })),
      machineReadable: [
        "/llms.txt",
        "/.well-known/ai-catalog.json",
        "/.well-known/webmcp.json"
      ]
    }
  },

  get_current_page: () => {
    const description = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content")
    const module = /^\/mods\/([A-Z0-9]+)/i.exec(location.pathname)?.[1]
    return {
      path: location.pathname + location.search,
      title: document.title,
      description,
      heading: document.querySelector("h1")?.textContent?.trim() ?? null,
      moduleCode: module?.toUpperCase() ?? null
    }
  },

  navigate_to: (args) => {
    const path = String(args.path ?? "")
    const ALLOWED =
      /^\/(?:(?:timetable|mods|exams|tools|articles|faq|links|changelog|settings|screenshot|privacy|feedback|ai-instructions|sitemap)(?:\/[A-Za-z0-9_-]+){0,3})?(?:\?[A-Za-z0-9_\-=&.%]*)?$/
    if (!ALLOWED.test(path)) {
      throw new ToolError(
        `"${path}" is not a page on this site. See get_site_info for pages.`
      )
    }
    // Defer so the tool result reaches the agent before the page unloads.
    setTimeout(() => window.location.assign(path), 50)
    return { navigating: true, path }
  },

  list_semesters: () => ({
    current: `${latestYear};${latestSemester}`,
    semesters: SEMESTERS.map((s) => ({ code: s.code, name: s.name }))
  }),

  search_modules: async (args) => {
    const modules = await loadModules()
    const limit = Math.min(Number(args.limit) || 25, 100)
    let results = filterModules(modules, {
      searchTerm: String(args.query ?? "").trim(),
      moduleType: String(args.category ?? "all"),
      moduleFaculty: args.school ? String(args.school).toUpperCase() : "all",
      moduleLevel: String(args.level ?? "all"),
      currentOnly: args.currentSemesterOnly !== false
    })
    if (args.au !== undefined) {
      results = results.filter((m) => parseFloat(m.au) === Number(args.au))
    }
    return {
      total: results.length,
      shown: Math.min(results.length, limit),
      modules: results.slice(0, limit).map((m) => ({
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
        url: `/mods/${m.code}`
      }))
    }
  },

  get_module: (args) => fetchModuleRecord(moduleCode(args)),

  get_current_module: () => {
    const code = /^\/mods\/([A-Z0-9]+)/i.exec(location.pathname)?.[1]
    if (!code) throw new ToolError("The user is not on a module page.")
    return fetchModuleRecord(code.toUpperCase())
  },

  get_module_indexes: async (args) => {
    const code = moduleCode(args)
    const { year, semester } = semesterOf(args)
    const all = await fetchSeasonIndexes(year, semester)
    const moduleIndexes = all[code]
    if (!moduleIndexes) {
      throw new ToolError(`${code} has no indexes in ${year};${semester}.`)
    }
    return {
      code,
      semester: `${year};${semester}`,
      indexCount: Object.keys(moduleIndexes).length,
      indexes: Object.entries(moduleIndexes).map(([index, slots]) => ({
        index,
        slots: slots.map(describeSlot)
      }))
    }
  },

  find_compatible_indexes: async (args) => {
    const code = moduleCode(args)
    const planIndex = planOf(args)
    const { moduleIndexes } = await requireOffered(code)
    const plan = await loadPlan(planIndex)
    const others = plan.entries.filter((e) => e.code !== code)

    const rows = Object.entries(moduleIndexes).map(([index, slots]) => {
      const probe: PlanEntry = {
        key: code,
        code,
        title: code,
        au: 0,
        isCustom: false,
        indexKey: index,
        slots
      }
      const clashesWith = [
        ...new Set(
          findClashes([probe, ...others])
            .filter((c) => c.between[0] === code)
            .map((c) => c.between[1])
        )
      ]
      return {
        index,
        fits: clashesWith.length === 0,
        clashesWith,
        slots: slots.map(describeSlot)
      }
    })
    return {
      code,
      plan: planIndex + 1,
      fitting: rows.filter((r) => r.fits).length,
      total: rows.length,
      indexes: rows
    }
  },

  get_exam: async (args) => {
    const code = moduleCode(args)
    const { year, semester } = semesterOf(args)
    const exam = (await fetchSeasonExams(year, semester))[code]
    if (!exam)
      throw new ToolError(`${code} has no exam listed for ${year};${semester}.`)
    return {
      code,
      semester: `${year};${semester}`,
      ...exam,
      venue: "not published in this data"
    }
  },

  list_exams: async (args) => {
    const { year, semester } = semesterOf(args)
    const all = Object.values(await fetchSeasonExams(year, semester))
    const query = String(args.query ?? "")
      .trim()
      .toLowerCase()
    const date = normaliseDate(String(args.date ?? ""))
    const limit = Math.min(Number(args.limit) || 50, 200)
    const matches = all.filter(
      (e) =>
        (!query ||
          e.key.toLowerCase().includes(query) ||
          e.name.toLowerCase().includes(query)) &&
        (!date || e.date.toLowerCase() === date)
    )
    return {
      semester: `${year};${semester}`,
      total: matches.length,
      exams: matches.slice(0, limit)
    }
  },

  get_timetable: (args) => describePlan(planOf(args)),

  list_plans: async () => {
    const state = store()
    const plans = await Promise.all(
      Array.from({ length: PLAN_COUNT }, async (_, i) => {
        const plan = await loadPlan(i)
        return {
          plan: i + 1,
          active: i === state.timetableIndex,
          modules: plan.entries.filter((e) => !e.isCustom).map((e) => e.code),
          customBlocks: plan.entries.filter((e) => e.isCustom).length,
          totalAu: plan.entries.reduce((sum, e) => sum + e.au, 0),
          clashes: findClashes(plan.entries).length
        }
      })
    )
    return { plans }
  },

  add_module_to_timetable: (args) =>
    addModule(
      moduleCode(args),
      args.index === undefined ? undefined : String(args.index),
      planOf(args)
    ),

  import_modules: async (args) => {
    if (!Array.isArray(args.codes))
      throw new ToolError("codes must be an array.")
    const planIndex = planOf(args)
    const added: unknown[] = []
    const skipped: { code: string; reason: string }[] = []
    // One at a time: each choice has to see the modules added before it.
    for (const raw of args.codes.slice(0, 20)) {
      try {
        added.push(
          await addModule(moduleCode({ code: raw }), undefined, planIndex)
        )
      } catch (error) {
        if (!(error instanceof ToolError)) throw error
        skipped.push({ code: String(raw), reason: error.message })
      }
    }
    return { plan: planIndex + 1, added, skipped }
  },

  remove_module_from_timetable: (args) => {
    const code = moduleCode(args)
    const planIndex = planOf(args)
    const current = store().timetables[planIndex] ?? {}
    if (!(code in current))
      throw new ToolError(`${code} is not in plan ${planIndex + 1}.`)
    const next = { ...current }
    delete next[code]
    store().updateTimetable(next, planIndex)
    return { removed: code, plan: planIndex + 1 }
  },

  set_module_index: async (args) => {
    const code = moduleCode(args)
    const planIndex = planOf(args)
    if (!(code in (store().timetables[planIndex] ?? {}))) {
      throw new ToolError(
        `${code} is not in plan ${planIndex + 1}. Use add_module_to_timetable.`
      )
    }
    return addModule(code, String(args.index), planIndex)
  },

  set_module_lock: (args) => {
    const code = moduleCode(args)
    const wanted = Boolean(args.locked)
    if (store().lockedModules.includes(code) !== wanted)
      store().toggleModuleLock(code)
    return { code, locked: wanted }
  },

  switch_plan: (args) => {
    const planIndex = planOf(args)
    store().updateTimetableIndex(planIndex)
    return { activePlan: planIndex + 1 }
  },

  clear_plan: async (args, agent) => {
    const planIndex = planOf(args)
    const state = store()
    const count =
      Object.keys(state.timetables[planIndex] ?? {}).length +
      (state.customCourses[planIndex] ?? []).length
    if (count === 0) return { plan: planIndex + 1, cleared: 0 }
    await confirmWithUser(
      `Clear all ${count} item(s) from plan ${planIndex + 1}?`,
      agent
    )
    state.updateTimetable({}, planIndex)
    state.setCustomCourses([], planIndex)
    return { plan: planIndex + 1, cleared: count }
  },

  add_custom_block: (args) => {
    const name = String(args.name ?? "")
      .trim()
      .slice(0, 40)
    if (!name) throw new ToolError("name is required.")
    if (!Array.isArray(args.sessions) || args.sessions.length === 0) {
      throw new ToolError("sessions needs at least one entry.")
    }
    const sessions: CustomCourseSession[] = args.sessions
      .slice(0, 30)
      .map((raw) => {
        const s = raw as Partial<CustomCourseSession>
        if (
          !Number.isInteger(s.day) ||
          s.day! < 1 ||
          s.day! > 7 ||
          !isValidHhmm(s.startTime) ||
          !isValidHhmm(s.endTime) ||
          toMinutes(s.endTime) <= toMinutes(s.startTime)
        ) {
          throw new ToolError(
            "Each session needs day 1-7, startTime and a later endTime (HHMM)."
          )
        }
        return {
          type: String(s.type ?? name).slice(0, 20),
          day: s.day!,
          startTime: s.startTime,
          endTime: s.endTime,
          venue: String(s.venue ?? "").slice(0, 60)
        }
      })
    const id = crypto.randomUUID()
    store().addCustomCourse({
      name,
      indexes: [{ id, label: "Option A", sessions }],
      selectedIndexId: id
    })
    const created = (store().customCourses[store().timetableIndex] ?? []).at(-1)
    return { plan: store().timetableIndex + 1, id: created?.id, name }
  },

  remove_custom_block: (args) => {
    const id = String(args.id ?? "")
    const state = store()
    if (
      !(state.customCourses[state.timetableIndex] ?? []).some(
        (c) => c.id === id
      )
    ) {
      throw new ToolError("No custom block with that id on the active plan.")
    }
    state.removeCustomCourse(id)
    return { removed: id }
  },

  get_generation_config: () => ({
    config: store().generationConfig,
    lockedModules: store().lockedModules
  }),

  update_generation_config: (args) => {
    const state = store()
    if (args.reset) state.updateGenerationConfig(DEFAULT_GENERATION_CONFIG)
    state.updateGenerationConfig(sanitiseGenerationConfig(args.config))
    return { config: store().generationConfig }
  },

  generate_timetables: async (args) => {
    const planIndex = planOf(args)
    const plan = await loadPlan(planIndex)
    const moduleKeys = Object.keys(plan.timetable)
    if (moduleKeys.length === 0)
      throw new ToolError("Add modules to the plan first.")

    const config: GenerationConfig = {
      ...plan.state.generationConfig,
      ...sanitiseGenerationConfig(args.config)
    }
    if (toMinutes(config.dayEndTime) <= toMinutes(config.dayStartTime)) {
      throw new ToolError("dayEndTime must be later than dayStartTime.")
    }

    const allIndexes: Record<string, Indexes> = {
      ...plan.indexes,
      ...plan.customIndexes
    }
    const generationKeys = [...Object.keys(plan.customIndexes), ...moduleKeys]
    const seeded: Timetable = { ...plan.timetable }
    for (const course of plan.customCourses) {
      const key = customCourseModuleKey(course.id)
      if (plan.customIndexes[key]) seeded[key] = course.selectedIndexId
    }

    const maxResults = Math.min(Number(args.maxResults) || 5, 20)
    const wanted = args.apply === undefined ? undefined : Number(args.apply)
    const result = generateCombinations(generationKeys, allIndexes, config, {
      maxResults: Math.max(maxResults, wanted ?? 0),
      lockedModules: plan.state.lockedModules,
      currentTimetable: seeded,
      uniqueTimeslotsOnly: true,
      timeBudgetMs: 700
    })

    if (result.combinations.length === 0) {
      return {
        found: 0,
        reason: "No combination satisfies every preference.",
        suggestions: diagnoseConstraints(
          generationKeys,
          allIndexes,
          config
        ).map((s) => s.label)
      }
    }

    let applied: number | undefined
    if (wanted !== undefined) {
      const chosen = result.combinations[wanted - 1]
      if (!chosen) {
        throw new ToolError(
          `Only ${result.combinations.length} option(s) were found.`
        )
      }
      const moduleTimetable: Timetable = {}
      const customSelections: Record<string, string> = {}
      for (const [key, indexKey] of Object.entries(chosen.timetable)) {
        if (isCustomCourseKey(key))
          customSelections[customCourseIdFromKey(key)] = indexKey
        else moduleTimetable[key] = indexKey
      }
      plan.state.updateTimetable(moduleTimetable, planIndex)
      if (plan.customCourses.length > 0) {
        plan.state.setCustomCourses(
          plan.customCourses.map((c) => ({
            ...c,
            selectedIndexId: customSelections[c.id] ?? c.selectedIndexId
          })),
          planIndex
        )
      }
      applied = wanted
    }

    return {
      found: result.combinations.length,
      truncated: result.truncated,
      appliedRank: applied ?? null,
      options: result.combinations.slice(0, maxResults).map((c, i) => ({
        rank: i + 1,
        score: c.score,
        freeDays: c.freeDays,
        daysWithClass: c.daysWithClass,
        indexes: Object.fromEntries(
          Object.entries(c.timetable).filter(([key]) => !isCustomCourseKey(key))
        )
      }))
    }
  },

  get_share_link: async (args) => {
    const plan = await loadPlan(planOf(args))
    return {
      link: buildShareLink(location.origin, plan.timetable, plan.customCourses),
      textCode: encodeTextBundle(plan.timetable, plan.customCourses)
    }
  },

  load_shared_timetable: async (args, agent) => {
    const decoded = decodeTextBundle(String(args.link ?? ""))
    if (!decoded)
      throw new ToolError(
        "That is not a valid NTUMods share link or text code."
      )
    const planIndex = planOf(args)
    const state = store()
    const existing =
      Object.keys(state.timetables[planIndex] ?? {}).length +
      (state.customCourses[planIndex] ?? []).length
    if (existing > 0) {
      await confirmWithUser(
        `Replace the ${existing} item(s) in plan ${planIndex + 1}?`,
        agent
      )
    }
    state.updateTimetable(decoded.timetable, planIndex)
    state.setCustomCourses(decoded.customCourses, planIndex)
    return {
      plan: planIndex + 1,
      modules: Object.keys(decoded.timetable),
      customBlocks: decoded.customCourses.length
    }
  },

  export_calendar_ics: async (args) => {
    const plan = await loadPlan(planOf(args))
    const indexLookup: Record<string, Index[]> = {}
    const titleLookup: Record<string, string> = {}
    const labelLookup: Record<string, string> = {}
    for (const entry of plan.entries) {
      indexLookup[entry.indexKey] = entry.slots
      titleLookup[entry.key] = entry.title
      labelLookup[entry.key] = entry.code
    }
    const timetable: Timetable = Object.fromEntries(
      plan.entries.map((e) => [e.key, e.indexKey])
    )
    const ics = getIcs(
      timetable,
      indexLookup,
      titleLookup,
      plan.state.settings.tableCell,
      labelLookup,
      plan.state.moduleRemarks,
      plan.state.indexRemarks
    )
    if (!ics)
      throw new ToolError("The plan has nothing with a fixed time to export.")
    return ics
  },

  list_favourites: async () => {
    const modules = await loadModules()
    const byCode = new Map(modules.map((m) => [m.code, m]))
    return {
      favourites: store().favouriteModules.map((code) => ({
        code,
        title: byCode.get(code)?.title ?? null,
        offeredThisSemester: Boolean(byCode.get(code)?.isCurrentSemester)
      }))
    }
  },

  set_favourite: async (args) => {
    const code = moduleCode(args)
    const wanted = Boolean(args.favourite)
    const modules = await loadModules()
    if (!modules.some((m) => m.code === code)) {
      throw new ToolError(`No module ${code} exists in the NTU data.`)
    }
    if (store().favouriteModules.includes(code) !== wanted)
      store().toggleFavourite(code)
    return { code, favourite: wanted }
  },

  calculate_cgpa_targets: (args) => {
    const { cgpa, done, remaining } = cgpaInputs(args)
    return {
      note: "Unofficial. Some programmes publish their own honours bands.",
      currentClass: classFor(cgpa),
      bands: planBands(cgpa, done, remaining).map((b) => ({
        class: b.label,
        minimumCgpa: b.min,
        averageGradePointsNeeded:
          b.status === "out of reach" ? null : Math.max(b.required, 0),
        status: b.status,
        lowestGradeThatWorks: b.grade
      }))
    }
  },

  project_cgpa: (args) => {
    const { cgpa, done, remaining } = cgpaInputs(args)
    const points = GRADES.find(([g]) => g === args.grade)?.[1]
    if (points === undefined)
      throw new ToolError("grade must be a letter from A to D.")
    const projected = projectedCgpa(cgpa, done, remaining, points)
    return {
      projectedCgpa: Math.round(projected * 100) / 100,
      honoursClass: classFor(projected)
    }
  }
}

function cgpaInputs(args: Args) {
  const cgpa = Number(args.currentCgpa)
  const done = Number(args.auCompleted)
  const remaining = Number(args.auRemaining)
  if (
    ![cgpa, done, remaining].every(Number.isFinite) ||
    cgpa < 0 ||
    cgpa > 5 ||
    done < 0 ||
    remaining <= 0
  ) {
    throw new ToolError(
      "currentCgpa must be 0-5, auCompleted >= 0 and auRemaining > 0."
    )
  }
  return { cgpa, done, remaining }
}

/** "2026-11-23" or "23 Nov 2026" -> "23 november 2026", the casing list_exams compares in. */
function normaliseDate(value: string): string {
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

export { handlers as webMcpHandlers }
