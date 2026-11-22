import { describe, expect, it } from "vitest"

import {
  compareCodePoints,
  formatDisplayDateShort,
  formatDisplayDateWeekday,
  formatLongDate,
  formatShortDate,
  parseDisplayDateUtc
} from "@/lib/format"

describe("formatShortDate", () => {
  it("formats an ISO date with fixed month names", () => {
    expect(formatShortDate("2026-09-03")).toBe("3 Sep 2026")
    expect(formatShortDate("2026-01-31")).toBe("31 Jan 2026")
    expect(formatLongDate("2026-09-03")).toBe("3 September 2026")
  })

  it("keeps the written day even when a time and offset follow", () => {
    expect(formatShortDate("2026-09-03T07:00:00+08:00")).toBe("3 Sep 2026")
  })

  it("returns unparseable input unchanged", () => {
    expect(formatShortDate("soon")).toBe("soon")
    expect(formatShortDate("2026-13-01")).toBe("2026-13-01")
  })
})

describe("display date helpers", () => {
  it("parses and formats DD Month YYYY dates in UTC without locale drift", () => {
    expect(parseDisplayDateUtc("23 November 2026")).toBe(Date.UTC(2026, 10, 23))
    expect(formatDisplayDateWeekday("23 November 2026")).toBe("Monday")
    expect(formatDisplayDateWeekday("2 December 2026")).toBe("Wednesday")
    expect(formatDisplayDateShort("23 November 2026")).toBe("23 Nov")
    expect(formatDisplayDateShort("23 November 2026", true)).toBe("23 Nov 2026")
    expect(formatDisplayDateShort("2 December 2026", true)).toBe("2 Dec 2026")
  })

  it("handles invalid dates cleanly", () => {
    expect(Number.isNaN(parseDisplayDateUtc("31 February 2026"))).toBe(true)
    expect(Number.isNaN(parseDisplayDateUtc("TBC"))).toBe(true)
    expect(formatDisplayDateWeekday("31 February 2026")).toBe("")
    expect(formatDisplayDateWeekday("TBC")).toBe("")
    expect(formatDisplayDateShort("TBC")).toBe("TBC")
  })

  it("orders digraph codes deterministically regardless of host locale", () => {
    const codes = ["ZZ1001", "CH1104", "CS2008", "AAE18C", "AD1101"]
    expect([...codes].sort(compareCodePoints)).toEqual([
      "AAE18C",
      "AD1101",
      "CH1104",
      "CS2008",
      "ZZ1001"
    ])
  })
})
