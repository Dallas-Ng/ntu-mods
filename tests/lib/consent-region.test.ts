import { expect, it } from "vitest"

import { defaultsToAnalytics } from "@/lib/consent-region"

it("defaults to on only for Singapore", () => {
  expect(defaultsToAnalytics("SG")).toBe(true)
  expect(defaultsToAnalytics("sg")).toBe(true)
  for (const c of ["MY", "DE", "GB", "T1", "XX", "", null, undefined])
    expect(defaultsToAnalytics(c)).toBe(false)
})
