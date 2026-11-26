import { describe, expect, it } from "vitest"

import { getAllAcademicYearCalendars } from "@/lib/academic-calendar"
import {
  academicCalendarEvents,
  calendarStatus
} from "@/lib/academic-calendar-events"
import { formatDayShort, formatRange } from "@/lib/calendar-format"
import { GET } from "@/astro/pages/calendar.ics"

const calendars = getAllAcademicYearCalendars()
const ay2026 = calendars.find((c) => c.academicYear === 2026)!

describe("calendarStatus", () => {
  it.each([
    ["2026-08-10", { kind: "teaching", semester: "2026;1", week: 1 }],
    // A weekend belongs to the week before it
    ["2026-08-16", { kind: "teaching", semester: "2026;1", week: 1 }],
    ["2026-09-30", { kind: "recess", semester: "2026;1" }],
    ["2026-10-04", { kind: "recess", semester: "2026;1" }],
    ["2026-10-05", { kind: "teaching", semester: "2026;1", week: 8 }],
    ["2026-11-20", { kind: "exams", semester: "2026;1" }],
    ["2027-03-03", { kind: "recess", semester: "2026;2" }],
    ["2027-04-12", { kind: "teaching", semester: "2026;2", week: 13 }]
  ])("%s", (today, expected) => {
    expect(calendarStatus(calendars, today)).toEqual(expected)
  })

  it("points to the next semester during a break", () => {
    expect(calendarStatus(calendars, "2026-12-20")).toEqual({
      kind: "between",
      next: { semester: "2026;2", start: "2027-01-11" }
    })
  })

  it("has no next semester after the last published one", () => {
    expect(calendarStatus([ay2026], "2027-06-01")).toEqual({ kind: "between" })
  })
})

describe("academicCalendarEvents", () => {
  it("scopes a semester export to that semester's days", () => {
    const summaries = academicCalendarEvents(ay2026, {
      semester: "2026;2"
    }).map((e) => e.summary)
    expect(summaries).toContain("Hari Raya Puasa: no classes")
    expect(summaries).not.toContain(
      "Deepavali (replacement holiday): no classes"
    )
    expect(
      summaries.some((s) => s.startsWith("Semester 2 Teaching Week"))
    ).toBe(false)
  })

  it("gives the feed teaching weeks and key events for the whole year", () => {
    const events = academicCalendarEvents(ay2026, {
      teachingWeeks: true,
      keyEvents: true
    })
    const summaries = events.map((e) => e.summary)
    expect(summaries).toContain("Semester 1 Teaching Week 1")
    expect(summaries).toContain("Semester 2 Teaching Week 13")
    expect(summaries).toContain("Convocation")
    expect(summaries).toContain("Students' Union Day: no classes")
    expect(new Set(events.map((e) => e.uid)).size).toBe(events.length)
  })
})

describe("/calendar.ics", () => {
  it("is a named feed that asks apps to refresh daily", async () => {
    const response = await GET({} as Parameters<typeof GET>[0])
    const ics = await response.text()
    expect(response.headers.get("Content-Type")).toContain("text/calendar")
    expect(ics).toContain("X-WR-CALNAME:NTU academic calendar")
    expect(ics).toContain("REFRESH-INTERVAL;VALUE=DURATION:P1D")
    expect(ics).toContain("SUMMARY:Recess week")
  })
})

describe("calendar dates", () => {
  it("formats days and ranges without the visitor's timezone", () => {
    expect(formatDayShort("2027-03-01")).toBe("Mon 1 Mar 2027")
    expect(formatRange("2027-03-01", "2027-03-05")).toBe("1 to 5 Mar 2027")
    expect(formatRange("2026-09-28", "2026-10-02")).toBe("28 Sep to 2 Oct 2026")
    expect(formatRange("2026-12-28", "2027-01-01")).toBe(
      "28 Dec 2026 to 1 Jan 2027"
    )
    expect(formatRange("2026-08-09", "2026-08-09")).toBe("9 Aug 2026")
  })
})
