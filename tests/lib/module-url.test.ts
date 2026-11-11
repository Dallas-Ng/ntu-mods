import { describe, expect, it } from "vitest"

import { getExamModuleUrl, getModuleUrl } from "@/lib/module-url"

describe("getExamModuleUrl", () => {
  it("links a bare code straight through", () => {
    expect(getExamModuleUrl("SC1003")).toBe("/mods/SC1003")
  })

  it("trims the exam portal's suffixes", () => {
    expect(getExamModuleUrl("MA3701*")).toBe("/mods/MA3701")
    expect(getExamModuleUrl("BF3218+")).toBe("/mods/BF3218")
  })

  it("trims every trailing suffix character", () => {
    expect(getExamModuleUrl("SC1003*+*")).toBe("/mods/SC1003")
  })
})

describe("getModuleUrl", () => {
  it("builds the evergreen module URL", () => {
    expect(getModuleUrl("SC1003")).toBe("/mods/SC1003")
  })
})
