import { describe, expect, it, vi } from "vitest"

import { getIcs } from "@/lib/get-ics"

// Pin the semester so the expected dates do not move when new data ships.
vi.mock("@/lib/semesters", () => ({
  latestYear: "2026",
  latestSemester: "2"
}))

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

/** Class events only, not the holidays and weeks that frame the semester. */
const classEvents = (ics: string | undefined) =>
  (ics ?? "").match(/UID:[^\r]*-w\d+@ntumods\.com/g) ?? []

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
      // Thursday: no holiday falls on a Thursday in AY2026 S2's teaching weeks
      { IDX1: [index({ day: 4, remarks: "Teaching Wk1,3-13" })] },
      { CZ2001: "Algorithms" }
    )
    // weeks 1,3,4,5,6,7,8,9,10,11,12,13 => 12 events
    expect(classEvents(ics)).toHaveLength(12)
  })

  it("drops a class on a public holiday and exports the holiday instead", () => {
    // Week 5 Monday is 8 Feb 2027, the Chinese New Year replacement holiday.
    const ics = getIcs(
      { CZ2001: "IDX1" },
      { IDX1: [index({ remarks: "Teaching Wk4-6" })] },
      { CZ2001: "Algorithms" }
    )
    expect(classEvents(ics)).toHaveLength(2)
    expect(ics).not.toContain("DTSTART:20270208T083000")
    expect(ics).toContain(
      "SUMMARY:Chinese New Year (replacement holiday): no classes"
    )
    expect(ics).toContain("DTSTART;VALUE=DATE:20270208")
  })

  it("drops classes after an early dismissal and notes ones cut short", () => {
    // Tuesday 9 Mar 2027 (week 9) is the eve of Hari Raya Puasa: classes
    // end at 14:30.
    const ics = getIcs(
      { LATE: "IDX1", SPAN: "IDX2" },
      {
        IDX1: [index({ key: "IDX1", day: 2, time: "1530-1630" })],
        IDX2: [index({ key: "IDX2", day: 2, time: "1330-1530" })]
      },
      { LATE: "Late class", SPAN: "Spanning class" }
    )
    expect(ics).not.toContain("DTSTART:20270309T153000")
    expect(ics).toContain("DTSTART:20270309T133000")
    expect(ics).toContain("Eve of Hari Raya Puasa: classes end at 14:30.")
  })

  it("keeps a custom block on a public holiday", () => {
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
    expect(ics).toContain("DTSTART:20270208T083000")
  })

  it("frames the semester with recess and exam weeks", () => {
    const ics = getIcs(
      { CZ2001: "IDX1" },
      { IDX1: [index()] },
      { CZ2001: "Algorithms" }
    )
    expect(ics).toContain("SUMMARY:Recess week")
    expect(ics).toContain("DTSTART;VALUE=DATE:20270301")
    expect(ics).toContain("SUMMARY:Revision and exam weeks")
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

  it("places week 8 after the recess week", () => {
    const ics = getIcs(
      { CZ2001: "IDX1" },
      { IDX1: [index({ remarks: "Teaching Wk8" })] },
      { CZ2001: "Algorithms" }
    )
    // Sem 2 recess is 1-5 Mar 2027, so week 8 starts on 8 Mar 2027.
    expect(ics).toContain("DTSTART:20270308T083000")
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
