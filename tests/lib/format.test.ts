import { describe, expect, it } from "vitest"

import { formatLongDate, formatShortDate } from "@/lib/format"

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
