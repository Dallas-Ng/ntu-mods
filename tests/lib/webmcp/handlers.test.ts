import { useBoundState } from "@/state/bound.state"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { latestSemester, latestYear } from "@/lib/semesters"
import { webMcpHandlers } from "@/lib/webmcp/handlers"

// The store persists to localStorage, which Node does not have.
vi.hoisted(() => {
  const data = new Map<string, string>()
  Object.assign(globalThis, {
    localStorage: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k)
    }
  })
})

// Handlers may throw before returning a promise; the registered tool wrapper
// awaits them inside a try, so tests call them the same way.
const h = Object.fromEntries(
  Object.entries(webMcpHandlers).map(([name, fn]) => [
    name,
    async (args: Record<string, unknown>) => fn(args)
  ])
) as Record<
  keyof typeof webMcpHandlers,
  (a: Record<string, unknown>) => Promise<unknown>
>

const slot = (key: string, day: number, time: string): Index => ({
  key,
  type: "LEC",
  group: "LE",
  day,
  time,
  venue: "LT1",
  remarks: "Teaching Wk1-13",
  duration: 4
})

const modules = [
  { code: "AA1001", title: "Alpha", au: "3.0", isCurrentSemester: true },
  { code: "BB1002", title: "Beta", au: "3.0", isCurrentSemester: true },
  { code: "CC1003", title: "Gamma", au: "4.0", isCurrentSemester: true }
]

// AA1001 has one index. BB1002 has a clashing one and a free one.
const indexes = {
  AA1001: { "100": [slot("100", 1, "0900-1100")] },
  BB1002: {
    "200": [slot("200", 1, "1000-1200")],
    "201": [slot("201", 2, "1000-1200")]
  },
  CC1003: { "300": [slot("300", 3, "0900-1000")] }
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("/modules.json")) return Response.json({ modules })
      if (url.endsWith(`/indexes/${latestYear}_${latestSemester}.json`))
        return Response.json(indexes)
      if (url.includes("/exams/")) return Response.json({})
      return new Response("{}", { status: 404 })
    })
  )
  useBoundState.getState().resetTimetables()
})

describe("timetable tools", () => {
  it("picks a non-clashing index when none is given", async () => {
    await h.add_module_to_timetable({ code: "aa1001" })
    const result = (await h.add_module_to_timetable({ code: "BB1002" })) as {
      index: string
      clashesWith: string[]
    }
    expect(result.index).toBe("201")
    expect(result.clashesWith).toEqual([])
  })

  it("reports a clash when the agent forces a clashing index", async () => {
    await h.add_module_to_timetable({ code: "AA1001" })
    const result = (await h.add_module_to_timetable({
      code: "BB1002",
      index: "200"
    })) as { clashesWith: string[] }
    expect(result.clashesWith).toEqual(["AA1001"])

    const plan = (await h.get_timetable({})) as {
      classClashes: { between: string[] }[]
      totalAu: number
    }
    expect(plan.classClashes).toHaveLength(1)
    expect(plan.totalAu).toBe(6)
  })

  it("rejects unknown indexes and modules not offered this semester", async () => {
    await expect(
      h.add_module_to_timetable({ code: "AA1001", index: "999" })
    ).rejects.toThrow(/no index 999/)
    await expect(h.add_module_to_timetable({ code: "ZZ9999" })).rejects.toThrow(
      /No module ZZ9999/
    )
    await expect(h.add_module_to_timetable({ code: "!!" })).rejects.toThrow(
      /not a valid module code/
    )
  })

  it("lists which indexes of a module fit around the plan", async () => {
    await h.add_module_to_timetable({ code: "AA1001" })
    const result = (await h.find_compatible_indexes({ code: "BB1002" })) as {
      fitting: number
      indexes: { index: string; fits: boolean }[]
    }
    expect(result.fitting).toBe(1)
    expect(result.indexes.find((i) => i.index === "200")?.fits).toBe(false)
  })

  it("imports several modules and reports the ones it skipped", async () => {
    const result = (await h.import_modules({
      codes: ["AA1001", "ZZ9999", "CC1003"]
    })) as { added: unknown[]; skipped: { code: string }[] }
    expect(result.added).toHaveLength(2)
    expect(result.skipped.map((s) => s.code)).toEqual(["ZZ9999"])
  })

  it("keeps plans separate", async () => {
    await h.add_module_to_timetable({ code: "AA1001", plan: 2 })
    expect(useBoundState.getState().timetables[1]).toEqual({ AA1001: "100" })
    expect(useBoundState.getState().timetables[0]).toEqual({})
    await expect(h.get_timetable({ plan: 9 })).rejects.toThrow(
      /between 1 and 5/
    )
  })

  it("asks the user before clearing a plan, and respects a refusal", async () => {
    await h.add_module_to_timetable({ code: "AA1001" })
    vi.stubGlobal("window", { confirm: () => false })
    await expect(h.clear_plan({})).rejects.toThrow(/declined/)
    expect(useBoundState.getState().timetables[0]).toEqual({ AA1001: "100" })

    vi.stubGlobal("window", { confirm: () => true })
    await h.clear_plan({})
    expect(useBoundState.getState().timetables[0]).toEqual({})
  })

  it("adds and removes a custom block and clash-checks it", async () => {
    await h.add_module_to_timetable({ code: "AA1001" })
    const created = (await h.add_custom_block({
      name: "Gym",
      sessions: [{ day: 1, startTime: 930, endTime: 1030 }]
    })) as { id: string }
    const plan = (await h.get_timetable({})) as {
      customBlocks: { id: string }[]
      classClashes: unknown[]
    }
    expect(plan.customBlocks[0].id).toBe(created.id)
    expect(plan.classClashes).toHaveLength(1)

    await h.remove_custom_block({ id: created.id })
    expect(useBoundState.getState().customCourses[0]).toEqual([])
    await expect(
      h.add_custom_block({
        name: "Bad",
        sessions: [{ day: 1, startTime: 1100, endTime: 1000 }]
      })
    ).rejects.toThrow(/later endTime/)
  })

  it("generates a clash-free option and applies it on request", async () => {
    await h.import_modules({ codes: ["AA1001", "BB1002"] })
    const result = (await h.generate_timetables({ apply: 1 })) as {
      found: number
      options: { indexes: Record<string, string> }[]
    }
    expect(result.found).toBeGreaterThan(0)
    expect(result.options[0].indexes.BB1002).toBe("201")
    expect(useBoundState.getState().timetables[0].BB1002).toBe("201")
  })

  it("round-trips a plan through a share link", async () => {
    vi.stubGlobal("location", { origin: "https://ntumods.com" })
    await h.add_module_to_timetable({ code: "AA1001" })
    const { link } = (await h.get_share_link({})) as { link: string }
    expect(link).toContain("https://ntumods.com/share?")
    await h.load_shared_timetable({ link, plan: 3 })
    expect(useBoundState.getState().timetables[2]).toEqual({ AA1001: "100" })
  })

  it("exports the plan as a calendar", async () => {
    await h.add_module_to_timetable({ code: "AA1001" })
    const ics = (await h.export_calendar_ics({})) as string
    expect(ics).toContain("BEGIN:VCALENDAR")
    expect(ics).toContain("[AA1001]")
  })
})

describe("grade tools", () => {
  it("reports which honours classes are reachable", async () => {
    const result = (await h.calculate_cgpa_targets({
      currentCgpa: 4.0,
      auCompleted: 90,
      auRemaining: 30
    })) as { bands: { class: string; status: string }[] }
    const status = Object.fromEntries(
      result.bands.map((b) => [b.class, b.status])
    )
    expect(status["Honours"]).toBe("secured")
    expect(status["Distinction"]).toBe("possible")
    expect(status["Highest Distinction"]).toBe("out of reach")
  })

  it("projects a CGPA from a letter grade", async () => {
    const result = (await h.project_cgpa({
      currentCgpa: 4.0,
      auCompleted: 60,
      auRemaining: 60,
      grade: "A"
    })) as { projectedCgpa: number; honoursClass: string }
    expect(result.projectedCgpa).toBe(4.5)
    expect(result.honoursClass).toBe("Highest Distinction")
  })

  it("rejects nonsense input", async () => {
    await expect(
      h.calculate_cgpa_targets({
        currentCgpa: 9,
        auCompleted: 1,
        auRemaining: 1
      })
    ).rejects.toThrow(/currentCgpa/)
  })
})

describe("data tools", () => {
  it("searches modules by text", async () => {
    const result = (await h.search_modules({ query: "bet" })) as {
      modules: { code: string }[]
    }
    expect(result.modules.map((m) => m.code)).toEqual(["BB1002"])
  })

  it("rejects a half-specified semester", async () => {
    await expect(
      h.get_module_indexes({ code: "AA1001", year: "2025" })
    ).rejects.toThrow(/both year and semester/)
  })

  it("only navigates to pages of this site", async () => {
    await expect(h.navigate_to({ path: "//evil.example" })).rejects.toThrow()
    await expect(h.navigate_to({ path: "/admin" })).rejects.toThrow()
  })
})
