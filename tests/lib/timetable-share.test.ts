import { describe, expect, it } from "vitest"

import {
  buildShareLink,
  decodeCustomBlocksParam,
  decodeTextBundle,
  encodeTextBundle,
  semesterFromParam
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

describe("semester in share payloads", () => {
  it("puts the semester in a link as sem=YYYY-S and reads it back", () => {
    const link = buildShareLink(
      "https://x.test",
      { CZ2001: "A1" },
      [],
      "2026;2"
    )
    expect(link).toContain("sem=2026-2")
    expect(decodeTextBundle(link)).toMatchObject({
      timetable: { CZ2001: "A1" },
      semester: "2026;2"
    })
  })

  it("keeps sem out of the module map", () => {
    const decoded = decodeTextBundle("/share?CZ2001=A1&sem=2026-1")
    expect(decoded?.timetable).toEqual({ CZ2001: "A1" })
  })

  it("round-trips the semester through a text bundle", () => {
    const bundle = encodeTextBundle({ CZ2001: "A1" }, [], "2026;1")
    expect(decodeTextBundle(bundle)?.semester).toBe("2026;1")
  })

  it("reads legacy links and v1 bundles as semester-less", () => {
    expect(decodeTextBundle("/share?CZ2001=A1")?.semester).toBeUndefined()
    const v1 = `NTUMODS1-${btoa(JSON.stringify({ v: 1, t: { CZ2001: "A1" }, c: [] }))}`
    expect(decodeTextBundle(v1)).toMatchObject({
      timetable: { CZ2001: "A1" },
      semester: undefined
    })
  })

  it("ignores a malformed semester param", () => {
    expect(semesterFromParam("2026;2")).toBeUndefined()
    expect(semesterFromParam("26-2")).toBeUndefined()
    expect(semesterFromParam("2026-2")).toBe("2026;2")
  })
})
