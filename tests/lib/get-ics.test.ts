import { describe, expect, it } from "vitest"

import { getIcs } from "@/lib/get-ics"

const index = (overrides: Partial<Index> = {}): Index => ({
  key: "IDX1",
  type: "LEC",
  group: "1",
  day: 1,
  time: "0830-0930",
  venue: "LT1",
  remarks: "",
  duration: 2,
  ...overrides
})

describe("getIcs", () => {
  it("puts the venue in the event location", () => {
    const ics = getIcs(
      { CZ2001: "IDX1" },
      { IDX1: [index()] },
      { CZ2001: "Algorithms" }
    )
    expect(ics).toContain("LOCATION:LT1")
  })

  it("skips slots with no fixed day (online/no timeslot)", () => {
    const ics = getIcs(
      { CZ2001: "IDX1" },
      { IDX1: [index({ day: 0 })] },
      { CZ2001: "Algorithms" }
    )
    expect(ics).not.toContain("BEGIN:VEVENT")
  })

  it("expands weekly remarks into one event per teaching week", () => {
    const ics = getIcs(
      { CZ2001: "IDX1" },
      { IDX1: [index({ remarks: "Teaching Wk1,3-13" })] },
      { CZ2001: "Algorithms" }
    )
    const count = (ics?.match(/BEGIN:VEVENT/g) ?? []).length
    // weeks 1,3,4,5,6,7,8,9,10,11,12,13 => 12 events
    expect(count).toBe(12)
  })

  it("produces no events for indexes not conducted during teaching weeks", () => {
    const ics = getIcs(
      { CZ2001: "IDX1" },
      {
        IDX1: [index({ remarks: "Not conducted during Teaching Weeks" })]
      },
      { CZ2001: "Algorithms" }
    )
    expect(ics).not.toContain("BEGIN:VEVENT")
  })

  it("shifts weeks 8-13 back by the recess week", () => {
    const ics = getIcs(
      { CZ2001: "IDX1" },
      { IDX1: [index({ remarks: "Teaching Wk8" })] },
      { CZ2001: "Algorithms" }
    )
    // Week 1 Monday is 2026-08-10 (Mon), week 8 lands on
    // WEEK_1_MONDAY + 8*7 days = 2026-10-05, not +7 weeks (2026-09-28).
    expect(ics).toContain("DTSTART:20261005T083000")
  })

  it("labels a custom block's type from remarks, not the type field", () => {
    const ics = getIcs(
      { gym: "IDX1" },
      {
        IDX1: [
          index({ isCustom: true, remarks: "Gym", type: "LEC" as IndexType })
        ]
      },
      { gym: "Gym Session" },
      undefined,
      { gym: "Gym" }
    )
    expect(ics).toContain("SUMMARY:[Gym] Gym")
    expect(ics).not.toContain("(1)")
  })

  it("includes module and index-level remarks with index override taking priority", () => {
    const ics = getIcs(
      { CZ2001: "IDX1" },
      { IDX1: [index()] },
      { CZ2001: "Algorithms" },
      undefined,
      undefined,
      { CZ2001: "module note" },
      { "CZ2001:IDX1": "index note" }
    )
    expect(ics).toContain("Note: index note")
    expect(ics).not.toContain("Note: module note")
  })
})
