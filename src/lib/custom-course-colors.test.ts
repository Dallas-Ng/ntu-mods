import { describe, expect, it } from "vitest"

import {
  CUSTOM_BLOCK_STYLE,
  customCourseIdFromKey,
  customCourseModuleKey,
  getCustomBlockStyle,
  isCustomCourseKey
} from "./custom-course-colors"
import { getIndexTypeStyle } from "./get-index-type-style"

describe("custom course module keys", () => {
  it("round-trips a course id through its module key", () => {
    const key = customCourseModuleKey("abc123")
    expect(isCustomCourseKey(key)).toBe(true)
    expect(customCourseIdFromKey(key)).toBe("abc123")
  })

  it("does not treat a real module code as a custom course key", () => {
    expect(isCustomCourseKey("CZ2001")).toBe(false)
  })
})

describe("getCustomBlockStyle", () => {
  it("uses the preset type's real style for LEC/TUT/etc", () => {
    expect(getCustomBlockStyle("LEC")).toEqual(getIndexTypeStyle("LEC"))
  })

  it("uses a dedicated style for LUNCH", () => {
    const style = getCustomBlockStyle("LUNCH")
    expect(style).not.toEqual(CUSTOM_BLOCK_STYLE)
  })

  it("falls back to the generic custom-block style for free-text labels", () => {
    expect(getCustomBlockStyle("Gym")).toEqual(CUSTOM_BLOCK_STYLE)
  })
})
