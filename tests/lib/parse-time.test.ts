import { describe, expect, it } from "vitest"

import { parseTime, parseTimeNumber } from "@/lib/parse-time"

const idx = (time: string): Index => ({
  key: "K",
  type: "LEC",
  group: "1",
  day: 1,
  time,
  venue: "LT1",
  remarks: "",
  duration: 2
})

describe("parseTimeNumber", () => {
  it("parses HHmm strings into numbers", () => {
    expect(parseTimeNumber(idx("0830-0930"))).toEqual({
      startTime: 830,
      endTime: 930
    })
  })
})

describe("parseTime", () => {
  it("parses HHmm strings into Date objects with matching hours/minutes", () => {
    const { startTime, endTime } = parseTime(idx("0830-0930"))
    expect(startTime.getHours()).toBe(8)
    expect(startTime.getMinutes()).toBe(30)
    expect(endTime.getHours()).toBe(9)
    expect(endTime.getMinutes()).toBe(30)
  })
})
