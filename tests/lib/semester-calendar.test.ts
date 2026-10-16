import SEMESTERS_JSON from "@/data/api/semesters.json"
import { describe, expect, it } from "vitest"

import { hasWeek1Start, WEEK_1_START } from "@/config/semester-calendar"
import { semestersWithOfferings } from "@/lib/server/db/json-source"

describe("semester calendar", () => {
  it("lists a Monday for every Week 1 date", () => {
    for (const [sem, date] of Object.entries(WEEK_1_START)) {
      // getDay() === 1 is Monday; a different day means a typo'd date.
      expect(new Date(`${date}T00:00:00`).getDay(), sem).toBe(1)
    }
  })

  it("has a Week 1 date for the latest semester", () => {
    const [latest] = semestersWithOfferings()
    expect(hasWeek1Start(`${latest.year};${latest.semester}`)).toBe(true)
  })

  // The bundled semesters.json, the file-store reader and (via
  // LATEST_SEMESTER_SQL) D1 each derive "latest"; the first two must agree.
  it("derives the same latest semester from semesters.json and the file store", () => {
    const [latest] = semestersWithOfferings()
    expect(SEMESTERS_JSON[0].code).toBe(`${latest.year};${latest.semester}`)
  })
})
