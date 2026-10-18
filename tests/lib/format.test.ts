import { describe, expect, it } from "vitest"

import { formatShortDate } from "@/lib/format"

describe("formatShortDate", () => {
  it("formats an ISO date with fixed month names", () => {
    expect(formatShortDate("2026-09-03")).toBe("3 Sep 2026")
    expect(formatShortDate("2026-01-31")).toBe("31 Jan 2026")
  })

  it("does not depend on the host timezone", () => {
    const original = process.env.TZ
    try {
      process.env.TZ = "America/Los_Angeles"
      expect(formatShortDate("2026-03-01")).toBe("1 Mar 2026")
    } finally {
      process.env.TZ = original
    }
  })
})
