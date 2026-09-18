import fc from "fast-check"
import { describe, expect, it } from "vitest"

import {
  generateCombinations,
  timeslotsOverlap
} from "@/lib/generate-timetable-combinations"
import { DEFAULT_GENERATION_CONFIG } from "@/lib/generation-config"

/**
 * These don't assert specific outputs (the example-based tests already do
 * that) — they throw random valid inputs at the engine and check invariants
 * that must hold no matter what: never hand back a clash, and the pure
 * overlap check must agree with a brute-force reference.
 */

// Half-hour slot index -> valid HHmm clock time, e.g. slot 1 -> 730, not 760.
const toHhmm = (slotIndex: number) => {
  const totalMinutes = 7 * 60 + slotIndex * 30
  return Math.floor(totalMinutes / 60) * 100 + (totalMinutes % 60)
}

const arbTime = fc
  .tuple(
    fc.integer({ min: 0, max: 29 }), // start slot: 0700 .. 2130
    fc.integer({ min: 1, max: 4 }) // duration in 30-min units
  )
  .map(([startSlot, units]) => {
    const pad = (n: number) => String(n).padStart(4, "0")
    return {
      time: `${pad(toHhmm(startSlot))}-${pad(toHhmm(startSlot + units))}`,
      duration: units
    }
  })

const arbIndex = (key: string): fc.Arbitrary<Index> =>
  fc
    .tuple(
      fc.integer({ min: 1, max: 5 }),
      arbTime,
      fc.constantFrom<IndexType>("LEC", "TUT", "LAB")
    )
    .map(([day, { time, duration }, type]) => ({
      key,
      type,
      group: "1",
      day,
      time,
      venue: "LT1",
      remarks: "",
      duration
    }))

describe("timeslotsOverlap (property)", () => {
  it("is symmetric and agrees with a brute-force minute-interval check", () => {
    fc.assert(
      fc.property(arbIndex("a"), arbIndex("b"), (a, b) => {
        const [aStart, aEnd] = a.time.split("-").map(Number)
        const [bStart, bEnd] = b.time.split("-").map(Number)
        const toMin = (hhmm: number) =>
          Math.floor(hhmm / 100) * 60 + (hhmm % 100)

        const reference =
          a.day === b.day &&
          toMin(aStart) < toMin(bEnd) &&
          toMin(bStart) < toMin(aEnd)

        expect(timeslotsOverlap(a, b)).toBe(reference)
        expect(timeslotsOverlap(a, b)).toBe(timeslotsOverlap(b, a))
      }),
      { numRuns: 500 }
    )
  })
})

const arbModuleIndexes = (moduleKey: string) =>
  fc
    .array(arbIndex(`${moduleKey}-idx`), { minLength: 1, maxLength: 3 })
    .map((slots) =>
      Object.fromEntries(slots.map((s, i) => [`${moduleKey}-${i}`, [s]]))
    )

describe("generateCombinations (property)", () => {
  it("never returns a combination containing two overlapping slots, for any random module set", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom("A", "B", "C"), {
          minLength: 2,
          maxLength: 3
        }),
        fc.array(arbModuleIndexes("m"), { minLength: 2, maxLength: 3 }),
        (moduleKeysRaw, indexesList) => {
          const moduleKeys = [...new Set(moduleKeysRaw)]
          const allIndexes: Record<string, Indexes> = {}
          moduleKeys.forEach((mk, i) => {
            allIndexes[mk] = indexesList[i % indexesList.length]
          })

          const { combinations } = generateCombinations(
            moduleKeys,
            allIndexes,
            DEFAULT_GENERATION_CONFIG,
            { maxResults: 10 }
          )

          for (const combo of combinations) {
            const chosenSlots = moduleKeys.flatMap(
              (mk) => allIndexes[mk][combo.timetable[mk]] ?? []
            )
            for (let i = 0; i < chosenSlots.length; i++) {
              for (let j = i + 1; j < chosenSlots.length; j++) {
                expect(timeslotsOverlap(chosenSlots[i], chosenSlots[j])).toBe(
                  false
                )
              }
            }
          }
        }
      ),
      { numRuns: 200 }
    )
  })
})
