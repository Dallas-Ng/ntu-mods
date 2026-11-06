import { describe, expect, it } from "vitest"

import { createIcs, formatIcsDate } from "@/lib/ics"

const stamp = new Date("2026-11-06T02:46:32Z")

const event = (
  overrides: Partial<Parameters<typeof createIcs>[0][number]> = {}
) => ({
  uid: "CZ2001-IDX1-w1@ntumods.com",
  start: new Date(2026, 7, 10, 8, 30),
  end: new Date(2026, 7, 10, 9, 30),
  summary: "[CZ2001] LEC (1)",
  location: "LT1",
  ...overrides
})

const write = (events = [event()]) => createIcs(events, { stamp })

describe("createIcs", () => {
  it("wraps events in a VCALENDAR with CRLF line endings", () => {
    const ics = write()

    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true)
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true)
    expect(ics).toContain("VERSION:2.0\r\n")
    expect(ics).not.toMatch(/[^\r]\n/)
  })

  it("writes the event's summary, location and floating local times", () => {
    const ics = write()

    expect(ics).toContain("SUMMARY:[CZ2001] LEC (1)")
    expect(ics).toContain("LOCATION:LT1")
    expect(ics).toContain("DTSTART:20260810T083000")
    expect(ics).toContain("DTEND:20260810T093000")
    // No trailing Z: floating time, so the class keeps its wall-clock time.
    expect(ics).not.toMatch(/DTSTART:\d{8}T\d{6}Z/)
  })

  it("writes DTSTAMP in UTC", () => {
    expect(write()).toContain("DTSTAMP:20261106T024632Z")
  })

  it("escapes commas, semicolons, backslashes and newlines", () => {
    const ics = write([
      event({ summary: "Algorithms; with, commas", location: "LT1\\2" })
    ])

    expect(ics).toContain("SUMMARY:Algorithms\\; with\\, commas")
    expect(ics).toContain("LOCATION:LT1\\\\2")
  })

  it("keeps multi-line descriptions on one folded line", () => {
    const ics = write([event({ description: "Algorithms\nNot a new line" })])

    expect(ics).toContain("DESCRIPTION:Algorithms\\nNot a new line")
  })

  it("folds lines longer than 75 octets with a leading space", () => {
    const long = "x".repeat(160)
    const lines = write([event({ summary: long })])
      .split("\r\n")
      .filter((line) => line.startsWith("SUMMARY:") || line.startsWith(" "))

    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines)
      expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75)
    expect(lines.join("").replace("SUMMARY:", "").replaceAll(" ", "")).toBe(
      long
    )
  })

  it("does not split a multi-byte character across a fold", () => {
    // Each emoji is 4 octets, so 75 never lands on a character boundary.
    const summary = "🎓".repeat(30)
    const ics = write([event({ summary })])

    expect(ics).toContain("🎓")
    for (const line of ics.split("\r\n"))
      expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75)
  })

  it("writes a calendar with no events when the timetable is empty", () => {
    const ics = write([])

    expect(ics).toContain("BEGIN:VCALENDAR")
    expect(ics).not.toContain("BEGIN:VEVENT")
  })
})

describe("formatIcsDate", () => {
  it("pads every field and omits the timezone", () => {
    expect(formatIcsDate(new Date(2026, 0, 2, 3, 4, 5))).toBe("20260102T030405")
  })
})
