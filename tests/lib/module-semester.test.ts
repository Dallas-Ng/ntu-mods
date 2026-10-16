import { describe, expect, it } from "vitest"

import { offeredIn } from "@/lib/module-semester"

describe("offeredIn", () => {
  it("uses the semesters list when the payload has one", () => {
    const m = { semesters: ["2026;2", "2026;1"], isCurrentSemester: true }
    expect(offeredIn(m, "2026;1")).toBe(true)
    expect(offeredIn({ ...m, semesters: ["2026;1"] }, "2026;2")).toBe(false)
  })

  it("treats an empty list as offered nowhere, even if flagged current", () => {
    expect(
      offeredIn({ semesters: [], isCurrentSemester: true }, "2026;2")
    ).toBe(false)
  })

  it("falls back to isCurrentSemester for payloads built before the list existed", () => {
    expect(offeredIn({ isCurrentSemester: true }, "2026;2")).toBe(true)
    expect(offeredIn({ isCurrentSemester: false }, "2026;2")).toBe(false)
    expect(offeredIn({}, "2026;2")).toBe(false)
  })
})
