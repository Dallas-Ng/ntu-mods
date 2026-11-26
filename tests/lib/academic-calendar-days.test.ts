import { describe, expect, it } from "vitest"

import { getSemesterCalendar } from "@/lib/academic-calendar"
import { getAllAcademicYearCalendars } from "@/lib/academic-calendar"
import {
  dayNotes,
  monthGrid,
  mondayOf,
  semesterMonths,
  semesterWeeks,
  weekLabel
} from "@/lib/academic-calendar-days"

const s1 = getSemesterCalendar("2026;1")!
const ay2026 = getAllAcademicYearCalendars().find(
  (c) => c.academicYear === 2026
)!

describe("semesterWeeks", () => {
  it("runs weeks 1-7, recess, 8-13, then three exam weeks", () => {
    expect(semesterWeeks(s1).map((w) => w.short)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "R",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "E",
      "E",
      "E"
    ])
  })
})

describe("weekLabel", () => {
  it("labels teaching, recess, exam and outside weeks", () => {
    expect(weekLabel(s1, "2026-08-10")?.long).toBe("Teaching Week 1")
    expect(weekLabel(s1, "2026-09-28")?.kind).toBe("recess")
    expect(weekLabel(s1, "2026-11-30")?.kind).toBe("exams")
    expect(weekLabel(s1, "2026-08-03")).toBeUndefined()
  })
})

describe("monthGrid", () => {
  it("starts rows on Monday and blanks days from other months", () => {
    const august = monthGrid(2026, 8)
    // 1 Aug 2026 is a Saturday
    expect(august.rows[0].monday).toBe("2026-07-27")
    expect(august.rows[0].days).toEqual([
      null,
      null,
      null,
      null,
      null,
      "2026-08-01",
      "2026-08-02"
    ])
    expect(august.rows.at(-1)?.days[0]).toBe("2026-08-31")
    expect(august.rows).toHaveLength(6)
  })

  it("ends December without spilling into January", () => {
    const december = monthGrid(2026, 12)
    expect(december.rows.at(-1)?.days.filter(Boolean).at(-1)).toBe("2026-12-31")
  })
})

describe("semesterMonths", () => {
  it("covers August to December for Semester 1", () => {
    expect(semesterMonths(s1).map((m) => m.month)).toEqual([8, 9, 10, 11, 12])
  })
})

describe("dayNotes", () => {
  it("explains a replacement holiday, an early finish and Students' Union Day", () => {
    expect(dayNotes(ay2026, "2026-08-10")).toEqual([
      {
        type: "holiday",
        text: "National Day (replacement holiday): no classes"
      }
    ])
    expect(dayNotes(ay2026, "2027-02-05")[0].type).toBe("early")
    expect(dayNotes(ay2026, "2026-09-04")[0]).toEqual({
      type: "noClasses",
      text: "Students' Union Day: no classes 10:30 to 14:30"
    })
    expect(dayNotes(ay2026, "2026-08-18")).toEqual([])
  })
})

describe("mondayOf", () => {
  it("maps Sunday back to its Monday", () => {
    expect(mondayOf("2026-08-16")).toBe("2026-08-10")
    expect(mondayOf("2026-08-10")).toBe("2026-08-10")
  })
})
