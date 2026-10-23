// The code behind each /mcp tool. All I/O comes in through `deps`, so the
// handlers run (and are tested) without a worker. Memoised files live in the
// closure: create the handlers once per isolate, not once per request.

import SEMESTERS from "@/data/api/semesters.json"

import type { AllModule } from "@/types/mods"
import { describeSlot, filterExams, searchModuleList } from "@/lib/mcp/shared"
import {
  limitOf,
  moduleCode,
  queryOf,
  searchFilters,
  semesterOf,
  type Args
} from "@/lib/mcp/validate"
import { toModuleJson } from "@/lib/module-json"
import { latestSemester, latestYear } from "@/lib/semesters"
import type {
  ModuleFullSnapshot,
  ModuleSnapshot
} from "@/lib/server/edge/get-module-snapshot"
import { ToolError } from "@/lib/webmcp/core"

type SeasonIndexes = Record<string, Record<string, Index[]>>

export interface McpDeps {
  /** Parsed JSON of a static file under /data/api, or null if it does not exist. */
  loadAsset(path: string): Promise<unknown | null>
  getKnownCodes(): Promise<Set<string> | null>
  getLatestModuleSnapshot(code: string): Promise<ModuleFullSnapshot | null>
  getModuleSnapshot(
    code: string,
    year: string,
    semester: string
  ): Promise<ModuleSnapshot | null>
  /** Shared edge cache for D1 results. Values are JSON. */
  cache: {
    get(key: string): Promise<unknown | undefined>
    put(key: string, value: unknown): Promise<void>
  }
}

const SITE = "https://ntumods.com"
const UNAVAILABLE = "The module service is unavailable. Try again shortly."

export function createMcpHandlers(deps: McpDeps) {
  // One promise per file. A failed load is dropped so the next call retries.
  // Only the files in the plan are kept: older semesters' indexes (about 1.2 MB
  // each) are never held, they come from D1 instead.
  const files = new Map<string, Promise<unknown>>()
  const memo = <T>(path: string): Promise<T> => {
    let hit = files.get(path)
    if (!hit) {
      hit = deps.loadAsset(path).catch((e) => {
        files.delete(path)
        throw e
      })
      files.set(path, hit)
    }
    return hit as Promise<T>
  }

  const loadModules = async () => {
    const data = await memo<{ modules: AllModule[] } | null>(
      "/data/api/modules.json"
    )
    if (!data) throw new ToolError("The module list is unavailable.")
    return data.modules
  }

  const loadExams = async (year: string, semester: string) =>
    (await memo<Record<string, Exam> | null>(
      `/data/api/exams/${year}_${semester}.json`
    )) ?? {}

  const knownOrThrow = async (code: string) => {
    const known = await deps.getKnownCodes()
    if (known && !known.has(code)) {
      throw new ToolError(`No module ${code} exists in the NTU data.`)
    }
  }

  /** Read through the edge cache. Absent results are cached as null too. */
  async function cached<T>(key: string, load: () => Promise<T | null>) {
    const hit = (await deps.cache.get(`${SITE}/mcp-cache/${key}`)) as
      { value: T | null } | undefined
    if (hit) return hit.value
    let value: T | null
    try {
      value = await load()
    } catch (error) {
      console.error("[mcp] database read failed", error)
      throw new ToolError(UNAVAILABLE)
    }
    await deps.cache.put(`${SITE}/mcp-cache/${key}`, { value })
    return value
  }

  return {
    list_semesters: () => ({
      current: `${latestYear};${latestSemester}`,
      semesters: SEMESTERS.map((s) => ({ code: s.code, name: s.name }))
    }),

    search_modules: async (args: Args) => {
      const { category, level, school, au } = searchFilters(args)
      return searchModuleList(
        await loadModules(),
        {
          query: queryOf(args.query),
          category,
          school,
          level,
          au,
          currentOnly: args.currentSemesterOnly !== false,
          limit: limitOf(args.limit, 25, 100)
        },
        SITE
      )
    },

    get_module: async (args: Args) => {
      const code = moduleCode(args)
      await knownOrThrow(code)
      const record = await cached(`module/${code}`, async () => {
        const snapshot = await deps.getLatestModuleSnapshot(code)
        return snapshot ? toModuleJson(snapshot) : null
      })
      if (!record)
        throw new ToolError(`No module ${code} exists in the NTU data.`)
      return record
    },

    get_module_indexes: async (args: Args) => {
      const code = moduleCode(args)
      const { year, semester, isLatest } = semesterOf(args)
      await knownOrThrow(code)
      const moduleIndexes = isLatest
        ? (
            await memo<SeasonIndexes | null>(
              `/data/api/indexes/${year}_${semester}.json`
            )
          )?.[code]
        : await cached(`indexes/${code}/${year}_${semester}`, async () => {
            const snapshot = await deps.getModuleSnapshot(code, year, semester)
            return snapshot?.indexes ?? null
          })
      if (!moduleIndexes || Object.keys(moduleIndexes).length === 0) {
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

    get_exam: async (args: Args) => {
      const code = moduleCode(args)
      const { year, semester } = semesterOf(args)
      const exam = (await loadExams(year, semester))[code]
      if (!exam) {
        throw new ToolError(
          `${code} has no exam listed for ${year};${semester}.`
        )
      }
      return {
        code,
        semester: `${year};${semester}`,
        ...exam,
        venue: "not published in this data"
      }
    },

    list_exams: async (args: Args) => {
      const { year, semester } = semesterOf(args)
      return {
        semester: `${year};${semester}`,
        ...filterExams(Object.values(await loadExams(year, semester)), {
          query: queryOf(args.query),
          date: String(args.date ?? "").slice(0, 40),
          limit: limitOf(args.limit, 50, 200)
        })
      }
    }
  }
}

export type McpHandlers = ReturnType<typeof createMcpHandlers>
