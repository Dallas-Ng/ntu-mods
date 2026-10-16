import { describe, expect, it } from "vitest"

import {
  bestMatchSemester,
  fitTimetable,
  modulesNotOffered
} from "@/lib/semester-match"

const slot = {} as Index
const sem1 = { CZ2001: { A1: [slot], A2: [slot] }, CZ1005: { B1: [slot] } }
const sem2 = { CZ2001: { A1: [slot] }, CZ3000: { C1: [slot] } }
const bySem = { "2026;2": sem2, "2026;1": sem1 }
const order = ["2026;2", "2026;1"]

describe("fitTimetable", () => {
  it("counts exact index matches and offered modules separately", () => {
    expect(fitTimetable({ CZ2001: "A2", CZ3000: "C1" }, sem1)).toEqual({
      exact: 1,
      offered: 1,
      total: 2
    })
  })
})

describe("bestMatchSemester", () => {
  it("picks the semester where the chosen indexes exist", () => {
    expect(
      bestMatchSemester([{ CZ1005: "B1", CZ2001: "A2" }], bySem, order)
    ).toBe("2026;1")
    expect(bestMatchSemester([{ CZ3000: "C1" }], bySem, order)).toBe("2026;2")
  })

  it("uses offered modules to break an index tie, across all plans", () => {
    // no index fits either semester, but 2026;2 offers both modules
    expect(
      bestMatchSemester([{ CZ2001: "ZZ" }, { CZ3000: "ZZ" }], bySem, order)
    ).toBe("2026;2")
  })

  it("sends a complete tie to the older semester", () => {
    expect(bestMatchSemester([{ CZ2001: "A1" }], bySem, order)).toBe("2026;1")
    expect(bestMatchSemester([{}], bySem, order)).toBe("2026;1")
  })
})

describe("modulesNotOffered", () => {
  it("lists codes missing from the semester", () => {
    expect(modulesNotOffered({ CZ2001: "A1", CZ1005: "B1" }, sem2)).toEqual([
      "CZ1005"
    ])
  })
})
