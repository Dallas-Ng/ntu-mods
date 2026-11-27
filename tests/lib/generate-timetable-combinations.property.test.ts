import fc from "fast-check"
import { describe, expect, it } from "vitest"

import { timeslotsOverlap } from "@/lib/generate-timetable-combinations"

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

const slot = (day: number, time: string): Index => ({
  key: "A1",
  type: "LEC",
  group: "1",
  day,
  time,
  venue: "LT1",
  remarks: "",
  duration: 2
})

describe("timeslotsOverlap (property)", () => {
  it("is symmetric and agrees with a brute-force minute-interval check", () => {
    fc.assert(
      fc.property(arbIndex("a"), arbIndex("b"), (a, b) => {
        const [aStart, aEnd] = a.time.split("-").map(Number)
        const [bStart, bEnd] = b.time.split("-").map(Number)
        const toMin = (hhmm: number) =>
          Math.floor(hhmm / 100) * 60 + (hhmm % 100)

        const occupiedMinutes = (start: number, end: number) =>
          Array.from(
            { length: toMin(end) - toMin(start) },
            (_, minute) => toMin(start) + minute
          )
        const minutesA = new Set(occupiedMinutes(aStart, aEnd))
        const reference =
          a.day === b.day &&
          occupiedMinutes(bStart, bEnd).some((minute) => minutesA.has(minute))

        expect(timeslotsOverlap(a, b)).toBe(reference)
        expect(timeslotsOverlap(a, b)).toBe(timeslotsOverlap(b, a))
      }),
      {
        numRuns: 500,
        examples: [
          [slot(1, "0900-1000"), slot(2, "0900-1000")],
          [slot(1, "0900-1000"), slot(1, "0930-1030")],
          [slot(1, "0900-1000"), slot(1, "1000-1100")]
        ]
      }
    )
  })
})
