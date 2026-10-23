import { describe, expect, it, vi } from "vitest"

import { toModuleJson } from "@/lib/module-json"
import { latestSemester, latestYear } from "@/lib/semesters"
import { ToolError } from "@/lib/webmcp/core"

import { exam, modules, setup, snapshot } from "./fixtures"

describe("list_semesters", () => {
  it("names the latest semester as current", () => {
    const { handlers } = setup()
    const result = handlers.list_semesters()
    expect(result.current).toBe(`${latestYear};${latestSemester}`)
    expect(result.semesters[0].code).toBe(result.current)
  })
})

describe("search_modules", () => {
  it("never returns more than 100 rows but counts every match", async () => {
    const { handlers } = setup()
    const result = await handlers.search_modules({
      query: "algebra",
      limit: 5000
    })
    expect(result.total).toBe(150)
    expect(result.shown).toBe(100)
    expect(result.modules).toHaveLength(100)
  })

  it("filters by AU and links to the site", async () => {
    const { handlers } = setup()
    const result = await handlers.search_modules({ au: 4 })
    expect(result.modules.map((m) => m.code)).toEqual(["AB1000"])
    expect(result.modules[0].url).toBe("https://ntumods.com/mods/AB1000")
  })

  it("parses modules.json once across calls", async () => {
    const { handlers, deps } = setup()
    await handlers.search_modules({})
    await handlers.search_modules({ query: "x" })
    expect(deps.loadAsset).toHaveBeenCalledTimes(1)
  })

  it("rejects a long query", async () => {
    const { handlers } = setup()
    await expect(
      handlers.search_modules({ query: "x".repeat(101) })
    ).rejects.toThrow(ToolError)
  })
})

describe("get_module", () => {
  it("returns the REST record shape", async () => {
    const { handlers } = setup()
    expect(await handlers.get_module({ code: "ab1000" })).toEqual(
      toModuleJson(snapshot("AB1000"))
    )
  })

  it("turns away unknown codes without touching the database", async () => {
    const { handlers, deps } = setup()
    await expect(handlers.get_module({ code: "ZZ9999" })).rejects.toThrow(
      ToolError
    )
    expect(deps.getLatestModuleSnapshot).not.toHaveBeenCalled()
  })

  it("reads the database once per module, then the cache", async () => {
    const { handlers, deps } = setup()
    await handlers.get_module({ code: "AB1000" })
    await handlers.get_module({ code: "AB1000" })
    expect(deps.getLatestModuleSnapshot).toHaveBeenCalledTimes(1)
  })

  it("turns a database failure into a tool error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const { handlers } = setup({
      getLatestModuleSnapshot: vi.fn(async () => {
        throw new Error("D1 down")
      })
    })
    await expect(handlers.get_module({ code: "AB1000" })).rejects.toThrow(
      /unavailable/
    )
  })
})

describe("get_module_indexes", () => {
  it("reads the latest semester from the static file, once", async () => {
    const { handlers, deps } = setup()
    const first = await handlers.get_module_indexes({ code: "AB1000" })
    await handlers.get_module_indexes({ code: "AB1000" })
    expect(first.indexCount).toBe(2)
    expect(first.indexes[0].slots[0]).toMatchObject({
      day: "Tue",
      venue: "LT1"
    })
    expect(deps.getModuleSnapshot).not.toHaveBeenCalled()
    expect(deps.loadAsset).toHaveBeenCalledTimes(1)
  })

  it("reads an older semester from the database, never its file", async () => {
    const { handlers, deps } = setup()
    const result = await handlers.get_module_indexes({
      code: "AB1000",
      year: "2025",
      semester: "1"
    })
    await handlers.get_module_indexes({
      code: "AB1000",
      year: "2025",
      semester: "1"
    })
    expect(result.indexes[0].index).toBe("20001")
    expect(deps.getModuleSnapshot).toHaveBeenCalledTimes(1)
    expect(deps.loadAsset).not.toHaveBeenCalled()
  })

  it("caches a missing offering so repeat calls skip the database", async () => {
    const { handlers, deps } = setup({
      getModuleSnapshot: vi.fn(async () => null)
    })
    const call = () =>
      handlers.get_module_indexes({
        code: "AB1000",
        year: "2025",
        semester: "1"
      })
    await expect(call()).rejects.toThrow(/no indexes/)
    await expect(call()).rejects.toThrow(/no indexes/)
    expect(deps.getModuleSnapshot).toHaveBeenCalledTimes(1)
  })

  it("rejects an unknown semester before any I/O", async () => {
    const { handlers, deps } = setup()
    await expect(
      handlers.get_module_indexes({
        code: "AB1000",
        year: "2026",
        semester: "9"
      })
    ).rejects.toThrow(ToolError)
    expect(deps.loadAsset).not.toHaveBeenCalled()
    expect(deps.getKnownCodes).not.toHaveBeenCalled()
    expect(deps.getModuleSnapshot).not.toHaveBeenCalled()
  })

  it("errors for a module with no indexes", async () => {
    const { handlers } = setup()
    await expect(
      handlers.get_module_indexes({ code: "AB1001" })
    ).rejects.toThrow(/no indexes/)
  })
})

describe("get_exam and list_exams", () => {
  it("returns an exam with a note that venues are not published", async () => {
    const { handlers } = setup()
    expect(await handlers.get_exam({ code: "ab1000" })).toMatchObject({
      code: "AB1000",
      date: "23 November 2026",
      venue: "not published in this data"
    })
  })

  it("errors when a module has no exam", async () => {
    const { handlers } = setup()
    await expect(handlers.get_exam({ code: "AB1002" })).rejects.toThrow(
      /no exam/
    )
  })

  it("matches an ISO date against the written exam date", async () => {
    const { handlers } = setup()
    const result = await handlers.list_exams({ date: "2026-11-24" })
    expect(result.exams.map((e) => e.key)).toEqual(["AB1001"])
  })

  it("filters by text and caps the limit at 200", async () => {
    const big = Object.fromEntries(
      Array.from({ length: 300 }, (_, i) => [
        `E${i}`,
        exam(`E${i}`, "1 May 2026")
      ])
    )
    const { handlers } = setup({
      loadAsset: vi.fn(async () => big)
    })
    const result = await handlers.list_exams({ limit: 9999 })
    expect(result.total).toBe(300)
    expect(result.exams).toHaveLength(200)
  })

  it("treats a semester with no exam file as empty", async () => {
    const { handlers } = setup()
    const result = await handlers.list_exams({ year: "2025", semester: "1" })
    expect(result).toMatchObject({ total: 0, exams: [] })
  })
})

describe("file memoisation", () => {
  it("retries after a failed load instead of remembering the failure", async () => {
    let calls = 0
    const { handlers } = setup({
      loadAsset: vi.fn(async () => {
        if (++calls === 1) throw new Error("network")
        return { modules }
      })
    })
    await expect(handlers.search_modules({})).rejects.toThrow("network")
    expect((await handlers.search_modules({})).total).toBe(150)
  })
})
