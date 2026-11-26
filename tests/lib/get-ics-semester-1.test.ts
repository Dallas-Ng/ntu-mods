import { describe, expect, it, vi } from "vitest"

import { getIcs } from "@/lib/get-ics"

// AY2026 Semester 1 has Students' Union Day: no UG classes 10:30 to 14:30.
vi.mock("@/lib/semesters", () => ({
  latestYear: "2026",
  latestSemester: "1"
}))

const index = (overrides: Partial<Index> = {}): Index => ({
  key: "IDX1",
  type: "LEC",
  group: "1",
  day: 5,
  time: "0830-0930",
  venue: "LT1",
  remarks: "Teaching Wk4",
  duration: 2,
  ...overrides
})

describe("getIcs in AY2026 Semester 1", () => {
  it("starts week 1 on the calendar's Monday", () => {
    const ics = getIcs(
      { CZ2001: "IDX1" },
      { IDX1: [index({ day: 1, remarks: "Teaching Wk1" })] }
    )
    // 10 Aug 2026 is the National Day replacement holiday, so week 1's
    // Monday class is dropped and the holiday exported instead.
    expect(ics).not.toContain("DTSTART:20260810T083000")
    expect(ics).toContain(
      "SUMMARY:National Day (replacement holiday): no classes"
    )
  })

  it("drops classes overlapping Students' Union Day's no-class window", () => {
    // Friday 4 Sep 2026 is in week 4.
    const ics = getIcs(
      { MORNING: "A", MIDDAY: "B", LATE: "C" },
      {
        A: [index({ key: "A", time: "0830-0930" })],
        B: [index({ key: "B", time: "1330-1530" })],
        C: [index({ key: "C", time: "1430-1530" })]
      }
    )
    expect(ics).toContain("DTSTART:20260904T083000")
    expect(ics).not.toContain("DTSTART:20260904T133000")
    expect(ics).toContain("DTSTART:20260904T143000")
    expect(ics).toContain("SUMMARY:Students' Union Day: no classes")
  })
})
