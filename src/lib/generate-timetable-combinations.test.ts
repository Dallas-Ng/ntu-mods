import { describe, expect, it } from "vitest"

import {
  diagnoseConstraints,
  diagnoseEmptyResult,
  generateCombinations,
  timeslotsOverlap
} from "./generate-timetable-combinations"
import { DEFAULT_GENERATION_CONFIG } from "./generation-config"

const idx = (day: number, time: string, type: IndexType = "LEC"): Index => ({
  key: `${day}-${time}`,
  type,
  group: "1",
  day,
  time,
  venue: "LT1",
  remarks: "",
  duration: 2
})

describe("timeslotsOverlap", () => {
  it("is false for different days", () => {
    expect(timeslotsOverlap(idx(1, "0900-1000"), idx(2, "0900-1000"))).toBe(
      false
    )
  })

  it("is true for overlapping times on the same day", () => {
    expect(timeslotsOverlap(idx(1, "0900-1000"), idx(1, "0930-1030"))).toBe(
      true
    )
  })

  it("is false for back-to-back slots that only touch at the boundary", () => {
    expect(timeslotsOverlap(idx(1, "0900-1000"), idx(1, "1000-1100"))).toBe(
      false
    )
  })
})

describe("generateCombinations", () => {
  it("never returns a combination with clashing slots across modules", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000")] },
      B: {
        B1: [idx(1, "0900-1000")], // clashes with A1
        B2: [idx(2, "0900-1000")] // free
      }
    }
    const { combinations } = generateCombinations(
      ["A", "B"],
      allIndexes,
      DEFAULT_GENERATION_CONFIG
    )

    expect(combinations.length).toBeGreaterThan(0)
    for (const combo of combinations) {
      expect(combo.timetable.A).toBe("A1")
      expect(combo.timetable.B).toBe("B2")
    }
  })

  it("returns no combinations when every option clashes", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000")] },
      B: { B1: [idx(1, "0900-1000")] }
    }
    const { combinations } = generateCombinations(
      ["A", "B"],
      allIndexes,
      DEFAULT_GENERATION_CONFIG
    )
    expect(combinations).toHaveLength(0)
  })

  it("respects a locked module's current selection", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000")], A2: [idx(3, "0900-1000")] },
      B: { B1: [idx(1, "0900-1000")], B2: [idx(2, "0900-1000")] }
    }
    const { combinations } = generateCombinations(
      ["A", "B"],
      allIndexes,
      DEFAULT_GENERATION_CONFIG,
      { lockedModules: ["A"], currentTimetable: { A: "A1" } }
    )
    for (const combo of combinations) {
      expect(combo.timetable.A).toBe("A1")
      expect(combo.timetable.B).toBe("B2")
    }
  })

  it("excludes slots outside the configured day window", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0600-0700")], A2: [idx(1, "0900-1000")] }
    }
    const { combinations } = generateCombinations(["A"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      dayStartTime: 800,
      dayEndTime: 2200
    })
    expect(combinations.every((c) => c.timetable.A === "A2")).toBe(true)
  })

  it("excludes a slot outside the day window unless its type is skippable", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0600-0700")] }
    }
    const strict = generateCombinations(["A"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      dayStartTime: 800,
      dayEndTime: 2200
    })
    expect(strict.combinations).toHaveLength(0)

    const skipped = generateCombinations(["A"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      dayStartTime: 800,
      dayEndTime: 2200,
      skippableTypes: ["LEC"]
    })
    expect(skipped.combinations).toHaveLength(1)
  })

  it("excludes a slot that overlaps a blacklisted timeslot", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000")], A2: [idx(1, "1100-1200")] }
    }
    const { combinations } = generateCombinations(["A"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      blacklistedTimeslots: [{ day: 1, startTime: 900, endTime: 1000 }]
    })
    expect(combinations.map((c) => c.timetable.A)).toEqual(["A2"])
  })

  it("excludes a slot that overlaps a lunch break", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "1200-1300")], A2: [idx(1, "1000-1100")] }
    }
    const { combinations } = generateCombinations(["A"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      lunchBreaks: [{ day: 1, startTime: 1200, endTime: 1300 }]
    })
    expect(combinations.map((c) => c.timetable.A)).toEqual(["A2"])
  })

  it("rejects combinations whose back-to-back slots exceed maxConsecutiveSlots", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000")] }, // 60 min
      B: { B1: [idx(1, "1000-1030")] } // touches A1, +30 min = 90 min total
    }
    const strict = generateCombinations(["A", "B"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      maxConsecutiveSlots: 2 // 60 min cap
    })
    expect(strict.combinations).toHaveLength(0)

    const relaxed = generateCombinations(["A", "B"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      maxConsecutiveSlots: 3 // 90 min cap
    })
    expect(relaxed.combinations).toHaveLength(1)
  })

  it("rejects combinations with less than the configured gap between classes", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000")] },
      B: { B1: [idx(1, "1015-1100")] } // 15 min gap
    }
    const strict = generateCombinations(["A", "B"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      minGapBetweenClasses: 2 // requires 60 min
    })
    expect(strict.combinations).toHaveLength(0)

    const relaxed = generateCombinations(["A", "B"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      minGapBetweenClasses: 0
    })
    expect(relaxed.combinations).toHaveLength(1)
  })

  it("rejects a back-to-back type pairing the user asked to avoid", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000", "LEC")] },
      B: { B1: [idx(1, "1000-1030", "TUT")] } // touches A1, no gap
    }
    const { combinations } = generateCombinations(["A", "B"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      avoidBackToBackTypes: [["LEC", "TUT"]]
    })
    expect(combinations).toHaveLength(0)
  })

  it("rejects a day whose scheduled hours exceed maxDailyHours, ignoring skippable types", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1100", "LEC")] }, // 2h
      B: { B1: [idx(1, "1300-1500", "TUT")] } // 2h more, no overlap/gap issue
    }
    const strict = generateCombinations(["A", "B"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      maxDailyHours: 3
    })
    expect(strict.combinations).toHaveLength(0)

    const withSkip = generateCombinations(["A", "B"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      maxDailyHours: 3,
      skippableTypes: ["TUT"]
    })
    expect(withSkip.combinations).toHaveLength(1)
  })

  it("lets collisionIgnoreTypes suppress a clash for the ignored slot type", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000", "TUT")] },
      B: { B1: [idx(1, "0900-1000", "LEC")] }
    }
    const strict = generateCombinations(["A", "B"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG
    })
    expect(strict.combinations).toHaveLength(0)

    const ignored = generateCombinations(["A", "B"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      collisionIgnoreTypes: { A: ["TUT"] }
    })
    expect(ignored.combinations).toHaveLength(1)
  })

  it("deduplicates full combinations that land on the same overall timeslot shape", () => {
    // A1+B1 and A2+B2 both occupy {day1, day2} at the same time/type — same
    // overall shape reached via two different index assignments.
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000")], A2: [idx(2, "0900-1000")] },
      B: { B1: [idx(2, "0900-1000")], B2: [idx(1, "0900-1000")] }
    }
    const { combinations, duplicatesSkipped } = generateCombinations(
      ["A", "B"],
      allIndexes,
      DEFAULT_GENERATION_CONFIG,
      { uniqueTimeslotsOnly: true }
    )
    expect(combinations).toHaveLength(1)
    expect(duplicatesSkipped).toBe(1)
  })

  it("truncates once maxResults is reached", () => {
    const allIndexes: Record<string, Indexes> = {
      A: {
        A1: [idx(1, "0900-1000")],
        A2: [idx(2, "0900-1000")],
        A3: [idx(3, "0900-1000")]
      }
    }
    const { combinations, truncated } = generateCombinations(
      ["A"],
      allIndexes,
      DEFAULT_GENERATION_CONFIG,
      { maxResults: 2 }
    )
    expect(combinations).toHaveLength(2)
    expect(truncated).toBe(true)
  })

  it("scores a combination that leaves a preferred free day higher", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000")], A2: [idx(5, "0900-1000")] }
    }
    const { combinations } = generateCombinations(["A"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      preferredFreeDays: [5]
    })
    expect(combinations[0].timetable.A).toBe("A1")
  })

  it("front-loads or back-loads the week based on preferredDayOrder", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000")], A2: [idx(5, "0900-1000")] }
    }
    const frontLoaded = generateCombinations(["A"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      preferredDayOrder: "front-load"
    })
    expect(frontLoaded.combinations[0].timetable.A).toBe("A1")

    const backLoaded = generateCombinations(["A"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      preferredDayOrder: "back-load"
    })
    expect(backLoaded.combinations[0].timetable.A).toBe("A2")
  })
})

describe("diagnoseConstraints", () => {
  it("suggests widening day hours when that alone unblocks a result", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0800-0900")] }
    }
    const suggestions = diagnoseConstraints(["A"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      dayStartTime: 900 // excludes the 0800 slot until relaxed back to 800
    })
    expect(suggestions.map((s) => s.label)).toContain(
      "Widen day hours to 08:00–22:00"
    )
  })

  it("suggests moving custom blocks when they are the only source of conflict", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000")] },
      __CC__gym: { i1: [idx(1, "0900-1000")] }
    }
    const suggestions = diagnoseConstraints(
      ["A", "__CC__gym"],
      allIndexes,
      DEFAULT_GENERATION_CONFIG
    )
    expect(
      suggestions.some((s) => s.label.includes("custom blocks clash"))
    ).toBe(true)
  })

  it("suggests nothing when the config is already unconstrained and nothing helps", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000")] },
      B: { B1: [idx(1, "0900-1000")] }
    }
    const suggestions = diagnoseConstraints(
      ["A", "B"],
      allIndexes,
      DEFAULT_GENERATION_CONFIG
    )
    expect(suggestions).toHaveLength(0)
  })
})

describe("diagnoseEmptyResult", () => {
  it("reports a module with no data for the current semester", () => {
    const message = diagnoseEmptyResult(["A"], {}, DEFAULT_GENERATION_CONFIG)
    expect(message).toContain("Module A has no data")
  })

  it("reports when a module has no slots inside the configured hours", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0600-0700")] }
    }
    const message = diagnoseEmptyResult(["A"], allIndexes, {
      ...DEFAULT_GENERATION_CONFIG,
      dayStartTime: 800,
      dayEndTime: 2200
    })
    expect(message).toContain("no available slots within your configured hours")
  })

  it("falls back to a generic scheduling-conflict message otherwise", () => {
    const allIndexes: Record<string, Indexes> = {
      A: { A1: [idx(1, "0900-1000")] },
      B: { B1: [idx(1, "0900-1000")] }
    }
    const message = diagnoseEmptyResult(
      ["A", "B"],
      allIndexes,
      DEFAULT_GENERATION_CONFIG
    )
    expect(message).toContain("All combinations have scheduling conflicts")
  })

  it("skips custom-block keys when diagnosing", () => {
    const message = diagnoseEmptyResult(
      ["__CC__gym"],
      {},
      DEFAULT_GENERATION_CONFIG
    )
    expect(message).toContain("All combinations have scheduling conflicts")
  })
})
