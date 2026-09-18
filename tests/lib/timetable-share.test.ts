import { describe, expect, it } from "vitest"

import {
  buildShareLink,
  decodeCustomBlocksParam,
  decodeTextBundle,
  encodeTextBundle
} from "@/lib/timetable-share"

const customCourse = (): CustomCourse => ({
  id: "c1",
  name: "Gym",
  selectedIndexId: "i1",
  indexes: [
    {
      id: "i1",
      label: "Option A",
      sessions: [
        { type: "Gym", day: 1, startTime: 700, endTime: 800, venue: "Hall" }
      ]
    }
  ]
})

describe("share link + text bundle roundtrip", () => {
  it("round-trips a timetable and custom blocks through a share link", () => {
    const timetable = { CZ2001: "A1", CZ1112: "B2" }
    const link = buildShareLink("https://x.test", timetable, [customCourse()])
    const decoded = decodeTextBundle(link)

    expect(decoded?.timetable).toEqual(timetable)
    expect(decoded?.customCourses).toHaveLength(1)
    expect(decoded?.customCourses[0].name).toBe("Gym")
    expect(decoded?.customCourses[0].indexes[0].sessions[0]).toMatchObject({
      type: "Gym",
      day: 1,
      startTime: 700,
      endTime: 800,
      venue: "Hall"
    })
  })

  it("round-trips through the NTUMODS1- text bundle format", () => {
    const timetable = { CZ2001: "A1" }
    const bundle = encodeTextBundle(timetable, [customCourse()])
    expect(bundle.startsWith("NTUMODS1-")).toBe(true)

    const decoded = decodeTextBundle(bundle)
    expect(decoded?.timetable).toEqual(timetable)
    expect(decoded?.customCourses[0].name).toBe("Gym")
  })

  it("rejects garbage input instead of throwing", () => {
    expect(decodeTextBundle("not a real bundle")).toBeUndefined()
    expect(decodeTextBundle("NTUMODS1-%%%not-base64%%%")).toBeUndefined()
  })

  it("drops a session with an invalid time range rather than keeping bad data", () => {
    const bad: CustomCourse = {
      id: "c1",
      name: "Bad",
      selectedIndexId: "i1",
      indexes: [
        {
          id: "i1",
          label: "A",
          sessions: [
            { type: "X", day: 1, startTime: 900, endTime: 800, venue: "" }
          ]
        }
      ]
    }
    const bundle = encodeTextBundle({}, [bad])
    const decoded = decodeTextBundle(bundle)
    // the only index had its only session dropped, so the course itself drops
    expect(decoded?.customCourses).toHaveLength(0)
  })

  it("returns undefined for an empty string", () => {
    expect(decodeTextBundle("")).toBeUndefined()
    expect(decodeTextBundle("   ")).toBeUndefined()
  })

  it("returns undefined for a /share link with no modules and no custom blocks", () => {
    expect(decodeTextBundle("https://x.test/share?")).toBeUndefined()
  })

  it("decodeCustomBlocksParam returns [] for null/undefined and for corrupt data", () => {
    expect(decodeCustomBlocksParam(null)).toEqual([])
    expect(decodeCustomBlocksParam(undefined)).toEqual([])
    expect(decodeCustomBlocksParam("%%%not-base64%%%")).toEqual([])
  })
})
