import { describe, expect, it } from "vitest"

import {
  generateTimetableMatrix,
  getFirstTsIndex
} from "./generate-timetable-matrix"

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

describe("getFirstTsIndex", () => {
  it("finds the STARS_TIMESLOTS row matching an index's start time", () => {
    // slots start at 0800 in 30-min steps, so 0900 is the 3rd row (index 2)
    expect(getFirstTsIndex(idx({ time: "0900-1000" }))).toBe(2)
  })
})

describe("generateTimetableMatrix", () => {
  it("places a slot at its start row/day and extends it across its duration", () => {
    const { TABLE_MATRIX } = generateTimetableMatrix({
      A: [idx({ time: "0900-1000", duration: 2, day: 1 })]
    })
    const startRow = getFirstTsIndex(idx({ time: "0900-1000" }))
    expect(TABLE_MATRIX[startRow][0]).toHaveLength(1)
    expect(TABLE_MATRIX[startRow + 1][0]).toHaveLength(1)
  })

  it("collapses duplicate lectures at the same slot across different venues", () => {
    const moduleIndexes: TimetableWithIndex = {
      A: [idx({ key: "A1", venue: "LT1" })],
      B: [idx({ key: "A2", venue: "LT2" })]
    }
    const { TABLE_MATRIX } = generateTimetableMatrix(moduleIndexes)
    const row = getFirstTsIndex(idx())
    // both lectures share a slot -> collapsed to a single "Multiple Venues" entry
    expect(TABLE_MATRIX[row][0]).toHaveLength(1)
    expect(TABLE_MATRIX[row][0][0].venue).toBe("Multiple Venues")
  })

  it("keeps non-lecture slots even when they share a timeslot with others", () => {
    const moduleIndexes: TimetableWithIndex = {
      A: [idx({ key: "A1", type: "LEC" })],
      B: [idx({ key: "B1", type: "TUT" })]
    }
    const { TABLE_MATRIX } = generateTimetableMatrix(moduleIndexes)
    const row = getFirstTsIndex(idx())
    expect(TABLE_MATRIX[row][0]).toHaveLength(2)
  })

  it("skips slots with no fixed day", () => {
    const { TABLE_MATRIX } = generateTimetableMatrix({
      A: [idx({ day: 0 })]
    })
    const allCells = Object.values(TABLE_MATRIX).flat().flat()
    expect(allCells).toHaveLength(0)
  })

  it("drops Saturday/Sunday columns when nothing is scheduled on them", () => {
    const { TABLE_MAX_DAY_COLUMNS } = generateTimetableMatrix({
      A: [idx({ day: 1 })]
    })
    expect(TABLE_MAX_DAY_COLUMNS[6]).toBeUndefined()
    expect(TABLE_MAX_DAY_COLUMNS[7]).toBeUndefined()
  })

  it("keeps Saturday when a Saturday index exists, even with no Sunday one", () => {
    const { TABLE_MAX_DAY_COLUMNS } = generateTimetableMatrix({
      A: [idx({ day: 6 })]
    })
    expect(TABLE_MAX_DAY_COLUMNS[6]).toBeGreaterThanOrEqual(1)
    expect(TABLE_MAX_DAY_COLUMNS[7]).toBeUndefined()
  })

  it("flags overflow once total day columns exceed the threshold", () => {
    const moduleIndexes: TimetableWithIndex = {}
    // 10 clashing slots on the same day/time -> 10 stacked columns for day 1
    for (let i = 0; i < 10; i++) {
      moduleIndexes[`M${i}`] = [idx({ key: `K${i}`, type: "TUT", day: 1 })]
    }
    const { TABLE_OVERFLOW_THRESHOLD } = generateTimetableMatrix(
      moduleIndexes,
      9
    )
    expect(TABLE_OVERFLOW_THRESHOLD).toBe(true)
  })

  it("shows the default empty-state row window when there are no indexes", () => {
    const { TABLE_MATRIX } = generateTimetableMatrix({})
    const rows = Object.keys(TABLE_MATRIX).map(Number)
    expect(Math.min(...rows)).toBe(3)
    expect(Math.max(...rows)).toBe(20)
  })
})
