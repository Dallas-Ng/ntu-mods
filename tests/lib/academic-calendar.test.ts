import { describe, expect, it } from "vitest"

import CALENDAR from "@/data/api/calendar.json"
import { getSemesterCalendar } from "@/lib/academic-calendar"

const day = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay()

describe("calendar.json", () => {
  it.each(Object.keys(CALENDAR))(
    "AY%s has 13 Monday teaching weeks per semester",
    (year) => {
      for (const sem of ["1", "2"]) {
        const weeks = getSemesterCalendar(`${year};${sem}`)?.teachingWeeks
        expect(Object.keys(weeks ?? {})).toHaveLength(13)
        for (const monday of Object.values(weeks ?? {}))
          expect(day(monday)).toBe(1)
      }
    }
  )

  it("matches the AY2026-27 dates NTU announced", () => {
    expect(getSemesterCalendar("2026;1")?.teachingWeeks["1"]).toBe("2026-08-10")
    expect(getSemesterCalendar("2026;2")?.teachingWeeks["1"]).toBe("2027-01-11")
    expect(getSemesterCalendar("2026;2")?.recess).toEqual({
      start: "2027-03-01",
      end: "2027-03-05"
    })
  })

  it("has no calendar for a special term", () => {
    expect(getSemesterCalendar("2026;S")).toBeUndefined()
  })
})
