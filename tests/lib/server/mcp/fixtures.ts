import { vi } from "vitest"

import { latestSemester, latestYear } from "@/lib/semesters"
import type {
  ModuleFullSnapshot,
  ModuleSnapshot
} from "@/lib/server/edge/get-module-snapshot"
import { createMcpHandlers, type McpDeps } from "@/lib/server/mcp/handlers"

export const LATEST = `${latestYear}_${latestSemester}`

export const slot = (over: Partial<Index> = {}): Index => ({
  key: "1",
  type: "LEC",
  group: "LE",
  day: 2,
  time: "0830-0920",
  venue: "LT1",
  remarks: "",
  duration: 2,
  ...over
})

export const modules = Array.from({ length: 150 }, (_, i) => ({
  code: `AB${String(1000 + i)}`,
  title: `Algebra ${i}`,
  au: i === 0 ? "4.0" : "3.0",
  faculty: "CSC",
  categories: ["CORE"],
  isCurrentSemester: true,
  latestYear: latestYear,
  latestSemester: latestSemester
}))

export const exam = (key: string, date: string): Exam => ({
  date,
  day: 1,
  start_time: "9.00 am",
  end_time: "11.30 am",
  key,
  name: `EXAM ${key}`,
  duration: 5
})

const assets: Record<string, unknown> = {
  "/data/api/modules.json": { modules },
  [`/data/api/indexes/${LATEST}.json`]: {
    AB1000: { "10001": [slot()], "10002": [slot({ day: 3 })] }
  },
  [`/data/api/exams/${LATEST}.json`]: {
    AB1000: exam("AB1000", "23 November 2026"),
    AB1001: exam("AB1001", "24 November 2026")
  }
}

export const snapshot = (code: string) =>
  ({
    moduleData: { code, title: `Algebra ${code}`, au: "3.0", searchKeys: [] },
    indexes: { "10001": [slot()] },
    exam: null,
    isCurrentOffering: true,
    isLatestOffering: true,
    year: latestYear,
    semester: latestSemester,
    otherSemesters: [],
    prereqNode: null,
    prereqGraph: {},
    related: [],
    knownCodes: []
  }) as unknown as ModuleFullSnapshot

export function setup(over: Partial<McpDeps> = {}) {
  const store = new Map<string, unknown>()
  const deps = {
    loadAsset: vi.fn(async (path: string) => assets[path] ?? null),
    getKnownCodes: vi.fn(
      async () => new Set<string>(modules.map((m) => m.code))
    ),
    getLatestModuleSnapshot: vi.fn(async (code: string) => snapshot(code)),
    getModuleSnapshot: vi.fn(
      async () =>
        ({ indexes: { "20001": [slot()] } }) as unknown as ModuleSnapshot
    ),
    cache: {
      get: vi.fn(async (key: string) => store.get(key)),
      put: vi.fn(async (key: string, value: unknown) => {
        store.set(key, value)
      })
    },
    ...over
  }
  return { deps, handlers: createMcpHandlers(deps) }
}
