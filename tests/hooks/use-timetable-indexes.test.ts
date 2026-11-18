import { describe, expect, it } from "vitest"

import { resolveHiddenModules } from "@/hooks/use-timetable-indexes"

describe("resolveHiddenModules", () => {
  const plan: Timetable = { CZ2001: "10001", CZ2002: "10002" }
  const timetables = [plan, {}, {}, {}, {}]
  const hidden = [["CZ2001"], [], [], [], []]

  it("hides modules on the stored plan being viewed", () => {
    expect([...resolveHiddenModules(timetables, 0, plan, hidden)]).toEqual([
      "CZ2001"
    ])
  })

  it("never hides on a shared or copied timetable", () => {
    expect(resolveHiddenModules(timetables, 0, { ...plan }, hidden).size).toBe(
      0
    )
  })

  it("copes with missing hidden state", () => {
    expect(resolveHiddenModules(timetables, 0, plan, undefined).size).toBe(0)
  })
})
