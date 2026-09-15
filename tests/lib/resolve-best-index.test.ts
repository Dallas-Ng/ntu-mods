import { describe, expect, it } from "vitest"

import { resolveBestIndex } from "@/lib/resolve-best-index"

const idx = (key: string, day: number, time: string): Index => ({
  key,
  type: "LEC",
  group: "1",
  day,
  time,
  venue: "LT1",
  remarks: "",
  duration: 2
})

describe("resolveBestIndex", () => {
  it("picks the first index when nothing conflicts", () => {
    const moduleIndexes = { A: [idx("A1", 1, "0900-1000")] }
    const result = resolveBestIndex(moduleIndexes, {}, {})
    expect(result).toBe("A1")
  })

  it("skips an index that overlaps an already-scheduled module", () => {
    const moduleIndexes = {
      A: [idx("A1", 1, "0900-1000"), idx("A2", 2, "0900-1000")]
    }
    const timetable = { B: "B1" }
    const seasonIndexes = { B: { B1: [idx("B1", 1, "0930-1030")] } }
    const result = resolveBestIndex(moduleIndexes, timetable, seasonIndexes)
    expect(result).toBe("A2")
  })

  it("treats extraOccupiedSlots (custom blocks) as conflicts too", () => {
    const moduleIndexes = {
      A: [idx("A1", 1, "0900-1000"), idx("A2", 3, "0900-1000")]
    }
    const result = resolveBestIndex(moduleIndexes, {}, {}, [
      idx("gym", 1, "0900-1000")
    ])
    expect(result).toBe("A2")
  })

  it("falls back to the first index when every option conflicts", () => {
    const moduleIndexes = { A: [idx("A1", 1, "0900-1000")] }
    const result = resolveBestIndex(moduleIndexes, {}, {}, [
      idx("gym", 1, "0900-1000")
    ])
    expect(result).toBe("A1")
  })

  it("ignores a module in the timetable with no selection yet", () => {
    const moduleIndexes = { A: [idx("A1", 1, "0900-1000")] }
    // B has an empty-string selection: should not be treated as a real slot
    const result = resolveBestIndex(moduleIndexes, { B: "" }, {})
    expect(result).toBe("A1")
  })

  it("flags a conflict when the new slot fully contains an existing one", () => {
    const moduleIndexes = {
      A: [idx("A1", 1, "0900-1100"), idx("A2", 2, "0900-1100")]
    }
    const result = resolveBestIndex(moduleIndexes, {}, {}, [
      idx("gym", 1, "0930-1000")
    ])
    expect(result).toBe("A2")
  })
})
