import { describe, expect, it } from "vitest"

import { getIndexType } from "./get-index-type"

describe("getIndexType", () => {
  it.each([
    ["LEC/1", "LEC"],
    ["LAB", "LAB"],
    ["SEM", "SEM"],
    ["TUT", "TUT"],
    ["DES", "DES"],
    ["PRJ", "PRJ"]
  ])("classifies %s as %s", (input, expected) => {
    expect(getIndexType(input)).toBe(expected)
  })

  it("defaults to LEC for an unrecognized type", () => {
    expect(getIndexType("GYM")).toBe("LEC")
  })
})
