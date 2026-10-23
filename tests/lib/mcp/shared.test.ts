import { describe, expect, it } from "vitest"

import { describeSlot, normaliseDate } from "@/lib/mcp/shared"

const slot = (over: Partial<Index> = {}): Index => ({
  key: "1",
  type: "LEC",
  group: "LE",
  day: 2,
  time: "0830-0920",
  venue: "LT1",
  remarks: "Wk1-13",
  duration: 2,
  ...over
})

describe("describeSlot", () => {
  it("names the day and keeps time, venue and remarks", () => {
    expect(describeSlot(slot())).toEqual({
      type: "LEC",
      group: "LE",
      day: "Tue",
      time: "0830-0920",
      venue: "LT1",
      remarks: "Wk1-13"
    })
  })

  it("marks online slots as having no fixed time", () => {
    expect(describeSlot(slot({ day: 0 }))).toMatchObject({
      day: "Online/TBA",
      time: "no fixed time"
    })
  })
})

describe("normaliseDate", () => {
  it("turns ISO dates into the lowercase written form exams use", () => {
    expect(normaliseDate("2026-11-23")).toBe("23 november 2026")
    expect(normaliseDate("2026-01-05")).toBe("5 january 2026")
  })

  it("lowercases written dates and trims", () => {
    expect(normaliseDate("  23 November 2026 ")).toBe("23 november 2026")
  })

  it("returns an empty string for blank input", () => {
    expect(normaliseDate("   ")).toBe("")
  })
})
