import { describe, expect, it } from "vitest"

import { cgpa, optimise, parseTranscriptLines, quotaUsage } from "@/lib/fgo"

const LINES = [
  "2024-2025 SEMESTER 1",
  "CC0007 SCIENCE & TECHNOLOGY FOR HUMANITY 3.0 B",
  "SC2000 PROBABILITY & STATISTICS FOR 3.0 B-",
  "COMPUTING",
  "SC2001 ALGORITHM DESIGN & ANALYSIS 3.0 PASS",
  "BDE1 3.0 EX",
  "2024-2025 SPECIAL TERM",
  "SC3910 PROFESSIONAL ATTACHMENT 5.0 A+",
  "2025-2026 SEMESTER 2",
  "SC3020 DATABASE SYSTEM PRINCIPLES 3.0 C",
  "SC4003 INTELLIGENT AGENTS 3.0 F",
  "SC4079 FINAL YEAR PROJECT 8.0 A-",
  "Cumulative Grade Point Average : 3.10"
]

describe("parseTranscriptLines", () => {
  const { mods, statedCgpa } = parseTranscriptLines(LINES)
  const by = (code: string) => mods.find((m) => m.code === code)!

  it("reads rows, ignores wrapped names, captures stated CGPA", () => {
    expect(mods).toHaveLength(8)
    expect(statedCgpa).toBe(3.1)
    expect(by("SC2000").name).toBe("PROBABILITY & STATISTICS FOR")
  })

  it("classifies statuses and locks FYP / attachments", () => {
    expect(by("SC2001").status).toBe("fgo")
    expect(by("BDE1").status).toBe("other")
    expect(by("SC3910").locked).toBe(true)
    expect(by("SC4079").locked).toBe(true)
    expect(by("SC3020").locked).toBe(false)
  })
})

describe("parseTranscriptLines edge cases", () => {
  it("reads a row where pdf.js merged the name and the AU", () => {
    const { mods } = parseTranscriptLines([
      "2025-2026 SEMESTER 2",
      "SC4012 SOFTWARE SECURITY3.0 PASS"
    ])
    expect(mods).toHaveLength(1)
    expect(mods[0]).toMatchObject({
      name: "SOFTWARE SECURITY",
      au: 3,
      status: "fgo"
    })
  })

  it("keeps digits that belong to the name", () => {
    const { mods } = parseTranscriptLines([
      "2024-2025 SEMESTER 1",
      "MH1810 MATHEMATICS 1 3.0 PASS"
    ])
    expect(mods[0]).toMatchObject({ name: "MATHEMATICS 1", au: 3 })
  })
})

describe("optimise", () => {
  const { mods } = parseTranscriptLines(LINES)
  const ids = (codes: string[]) =>
    new Set(mods.filter((m) => codes.includes(m.code)).map((m) => m.id))

  it("picks every module below the average, never touches locked modules", () => {
    const bde = new Set(mods.map((m) => m.id))
    const pick = optimise(mods, { quota: 24, bde })
    expect(pick).toEqual(ids(["SC4003", "SC3020", "SC2000", "CC0007"]))
    expect(pick.has(mods.find((m) => m.code === "SC4079")!.id)).toBe(false)
    expect(cgpa(mods, pick)).toBeGreaterThan(cgpa(mods))
  })

  it("respects the core sub-cap when nothing is a BDE", () => {
    // 3 AU already FGO'd as core, so only 9 AU of core headroom remain.
    const pick = optimise(mods, { quota: 24, bde: new Set() })
    const au = [...pick].reduce(
      (s, id) => s + mods.find((m) => m.id === id)!.au,
      0
    )
    expect(au).toBeLessThanOrEqual(9)
  })

  it("matches brute force on a tight quota", () => {
    const bde = new Set<string>()
    const quota = 6 // 3 used, so 3 AU free: exactly one module
    const pick = optimise(mods, { quota, bde })
    const best = Math.max(
      ...mods
        .filter((m) => m.status === "graded" && !m.locked)
        .map((m) => cgpa(mods, new Set([m.id])))
    )
    expect(cgpa(mods, pick)).toBeCloseTo(best, 10)
  })
})

describe("earlier FGO use", () => {
  const { mods } = parseTranscriptLines(LINES)
  const none = new Set<string>()

  it("counts Pass modules and hidden No Record AU in the quota", () => {
    expect(quotaUsage(mods, none, none)).toEqual({ total: 3, core: 3 })
    expect(quotaUsage(mods, none, none, { core: 6, bde: 3 })).toEqual({
      total: 12,
      core: 9
    })
  })

  it("leaves no room when the hidden AU fill the quota", () => {
    const pick = optimise(mods, {
      quota: 24,
      bde: new Set(mods.map((m) => m.id)),
      extra: { core: 0, bde: 21 }
    })
    expect(pick.size).toBe(0)
  })

  it("keeps the core cap tight when hidden core AU use it up", () => {
    const pick = optimise(mods, {
      quota: 24,
      bde: none,
      extra: { core: 9, bde: 0 }
    })
    expect(pick.size).toBe(0)
  })
})
