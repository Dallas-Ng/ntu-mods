import { describe, expect, it } from "vitest"

import {
  limitOf,
  moduleCode,
  queryOf,
  searchFilters,
  semesterOf
} from "@/lib/mcp/validate"
import { latestSemester, latestYear } from "@/lib/semesters"
import { ToolError } from "@/lib/webmcp/core"

describe("moduleCode", () => {
  it("uppercases and trims", () => {
    expect(moduleCode({ code: " sc1003 " })).toBe("SC1003")
  })

  it.each(["SC-1003", "", "A", "ABCDEFGHIJKLM", "../x", undefined])(
    "rejects %j",
    (code) => {
      expect(() => moduleCode({ code })).toThrow(ToolError)
    }
  )
})

describe("semesterOf", () => {
  it("defaults to the latest semester", () => {
    expect(semesterOf({})).toEqual({
      year: latestYear,
      semester: latestSemester,
      isLatest: true
    })
  })

  it("accepts a listed older semester", () => {
    expect(semesterOf({ year: "2025", semester: "1" })).toMatchObject({
      year: "2025",
      semester: "1",
      isLatest: false
    })
  })

  it.each([
    { year: "2026", semester: "9" },
    { year: "20261", semester: "1" },
    { year: "../x", semester: "1" },
    { year: "1999", semester: "1" },
    { year: "2025" },
    { semester: "1" }
  ])("rejects %j", (args) => {
    expect(() => semesterOf(args)).toThrow(ToolError)
  })
})

describe("queryOf", () => {
  it("trims and allows 100 characters", () => {
    expect(queryOf("  data ")).toBe("data")
    expect(queryOf("x".repeat(100))).toHaveLength(100)
  })

  it("rejects 101 characters", () => {
    expect(() => queryOf("x".repeat(101))).toThrow(ToolError)
  })
})

describe("limitOf", () => {
  it("clamps to the maximum and falls back for bad values", () => {
    expect(limitOf(1000, 25, 100)).toBe(100)
    expect(limitOf(10, 25, 100)).toBe(10)
    expect(limitOf(2.9, 25, 100)).toBe(2)
    for (const bad of [0, -5, "abc", NaN, undefined, null]) {
      expect(limitOf(bad, 25, 100)).toBe(25)
    }
  })
})

describe("searchFilters", () => {
  it("defaults every filter to all", () => {
    expect(searchFilters({})).toEqual({
      category: "all",
      level: "all",
      school: "all",
      au: undefined
    })
  })

  it("uppercases the school and treats ALL as no filter", () => {
    expect(searchFilters({ school: "csc" }).school).toBe("CSC")
    expect(searchFilters({ school: "all" }).school).toBe("all")
  })

  it.each([
    { category: "CORE,GLOAD" },
    { category: "nope" },
    { level: "9" },
    { level: "1,2" },
    { school: "C S" },
    { school: "a,b" },
    { au: "three" }
  ])("rejects %j", (args) => {
    expect(() => searchFilters(args)).toThrow(ToolError)
  })
})
