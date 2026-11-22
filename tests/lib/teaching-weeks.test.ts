import { describe, expect, it } from "vitest"

import {
  ALL_TEACHING_WEEKS,
  parseTeachingWeeks,
  weeksOverlap
} from "@/lib/teaching-weeks"

describe("parseTeachingWeeks", () => {
  it("treats empty remarks as all 13 teaching weeks", () => {
    expect(parseTeachingWeeks("")).toEqual(ALL_TEACHING_WEEKS)
  })

  it("returns an empty list when not conducted during teaching weeks", () => {
    expect(parseTeachingWeeks("Not conducted during Teaching Weeks")).toEqual(
      []
    )
  })

  it("expands ranges and individual weeks", () => {
    expect(parseTeachingWeeks("Teaching Wk1-9,11-13")).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13
    ])
    expect(parseTeachingWeeks("Teaching Wk10")).toEqual([10])
    expect(parseTeachingWeeks("Teaching Wk1,3,5,7,9,11,13")).toEqual([
      1, 3, 5, 7, 9, 11, 13
    ])
  })

  it("falls back to all weeks for custom or non-week remarks", () => {
    expect(parseTeachingWeeks("Gym")).toEqual(ALL_TEACHING_WEEKS)
    expect(parseTeachingWeeks("Online Course")).toEqual(ALL_TEACHING_WEEKS)
  })
})

describe("weeksOverlap", () => {
  it("returns true when two lists share any week", () => {
    expect(weeksOverlap([1, 2, 3], [3, 4, 5])).toBe(true)
  })

  it("returns false for disjoint or empty week lists", () => {
    expect(weeksOverlap([1, 3, 5, 7, 9, 11, 13], [2, 4, 6, 8, 10, 12])).toBe(
      false
    )
    expect(weeksOverlap([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13], [10])).toBe(
      false
    )
    expect(weeksOverlap([], [1, 2, 3])).toBe(false)
  })
})
