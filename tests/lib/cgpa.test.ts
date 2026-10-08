import { describe, expect, it } from "vitest"

import {
  classFor,
  gradedTotals,
  planBands,
  projectedCgpa,
  requiredAverage
} from "@/lib/cgpa"
import { parseTranscriptLines } from "@/lib/fgo"

describe("requiredAverage", () => {
  it("solves for the average the remaining AU must earn", () => {
    // 3.5 over 60 AU, 60 AU left, target 4.0 -> 4.5 on the rest
    expect(requiredAverage(3.5, 60, 60, 4)).toBeCloseTo(4.5)
  })
})

describe("planBands", () => {
  const by = (cgpa: number, done: number, left: number) =>
    Object.fromEntries(planBands(cgpa, done, left).map((b) => [b.label, b]))

  it("rounds the needed grade up to a letter", () => {
    const b = by(3.5, 60, 60)
    expect(b.Distinction.status).toBe("possible")
    expect(b.Distinction.grade).toBe("A-")
    expect(b["Highest Distinction"].required).toBeCloseTo(5.5)
    expect(b["Highest Distinction"].status).toBe("out of reach")
    expect(b.Merit.grade).toBe("B")
    expect(b.Honours.grade).toBe("C+")
  })

  it("marks a class secured when no grade can lose it", () => {
    expect(by(4.8, 120, 6).Honours.status).toBe("secured")
  })

  it("needs straight As when the average is exactly 5.0", () => {
    const b = by(4, 60, 60)
    expect(b["Highest Distinction"].required).toBeCloseTo(5)
    expect(b["Highest Distinction"].grade).toBe("A")
  })
})

describe("gradedTotals", () => {
  it("counts letter-graded modules only", () => {
    const { mods } = parseTranscriptLines([
      "2024-2025 SEMESTER 1",
      "SC2000 PROBABILITY 3.0 B",
      "SC2001 ALGORITHMS 3.0 PASS",
      "SC2002 OOP 4.0 A"
    ])
    expect(gradedTotals(mods)).toEqual({ points: 3 * 3.5 + 4 * 5, au: 7 })
  })
})

describe("projectedCgpa and classFor", () => {
  it("blends the remaining AU into the CGPA", () => {
    expect(projectedCgpa(3.5, 60, 60, 4.5)).toBeCloseTo(4)
    expect(classFor(4)).toBe("Distinction")
    expect(classFor(2.9)).toBeNull()
  })
})
