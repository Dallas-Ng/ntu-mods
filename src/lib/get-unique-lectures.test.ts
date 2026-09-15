import { describe, expect, it } from "vitest"

import { getUniqueLectures } from "./get-unique-lectures"

const idx = (overrides: Partial<Index> = {}): Index => ({
  key: "K1",
  type: "LEC",
  group: "1",
  day: 1,
  time: "0900-1000",
  venue: "LT1",
  remarks: "",
  duration: 2,
  ...overrides
})

describe("getUniqueLectures", () => {
  it("ignores non-lecture slots", () => {
    const result = getUniqueLectures({
      A: [idx({ type: "TUT" })]
    })
    expect(result).toHaveLength(0)
  })

  it("collapses lectures with the same slot but different venues into one, marked Multiple Venues", () => {
    const result = getUniqueLectures({
      A: [idx({ key: "K1", venue: "LT1" })],
      B: [idx({ key: "K2", venue: "LT2" })]
    })
    expect(result).toHaveLength(1)
    expect(result[0].venue).toBe("Multiple Venues")
  })

  it("keeps venue as-is when only one venue exists for a slot", () => {
    const result = getUniqueLectures({
      A: [idx({ key: "K1", venue: "LT1" })]
    })
    expect(result[0].venue).toBe("LT1")
  })

  it("treats lectures at different times as distinct", () => {
    const result = getUniqueLectures({
      A: [idx({ key: "K1", time: "0900-1000" })],
      B: [idx({ key: "K2", time: "1000-1100" })]
    })
    expect(result).toHaveLength(2)
  })

  it("ignores index key differences when ignoreIndexKey is true (default)", () => {
    const result = getUniqueLectures({
      A: [idx({ key: "K1" })],
      B: [idx({ key: "K2" })]
    })
    // key and venue are both ignored in the comparison, so two entries at the
    // same slot always count as "more than one venue" even if venue matches
    expect(result).toHaveLength(1)
    expect(result[0].venue).toBe("Multiple Venues")
  })

  it("treats differing keys as distinct when ignoreIndexKey is false", () => {
    const result = getUniqueLectures(
      {
        A: [idx({ key: "K1" })],
        B: [idx({ key: "K2" })]
      },
      false
    )
    expect(result).toHaveLength(2)
  })
})
