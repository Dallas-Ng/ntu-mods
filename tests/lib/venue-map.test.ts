import { describe, expect, it } from "vitest"

import {
  dayStops,
  fmtMin,
  legStatus,
  levelLabel,
  levelShort,
  project,
  ringsBounds,
  ringsPath,
  type MapVenue,
  type VenueData
} from "@/lib/venue-map"

const venue = (key: string): MapVenue => ({
  poi: 1,
  code: key,
  name: key,
  b: 1,
  z: 2,
  floor: "2",
  lon: 103.68,
  lat: 1.35,
  x: 10,
  y: 20,
  how: "fbs",
  slots: 1
})

const slot = (day: number, time: string, venueKey: string): Index => ({
  key: "1",
  type: "LEC",
  group: "A",
  day,
  time,
  venue: venueKey,
  remarks: "",
  duration: 2
})

describe("dayStops", () => {
  it("keeps one day, earliest first, and links known venues", () => {
    const tt: TimetableWithIndex = {
      CZ1: [slot(1, "1030-1220", "LT1"), slot(2, "0830-0920", "LT1")],
      CZ2: [slot(1, "0830-0920", "NOWHERE")]
    }
    const stops = dayStops(tt, 1, { LT1: venue("LT1") })
    expect(stops.map((s) => [s.code, s.start, s.end])).toEqual([
      ["CZ2", 510, 560],
      ["CZ1", 630, 740]
    ])
    expect(stops[0].venue).toBeNull()
    expect(stops[1].venue?.code).toBe("LT1")
  })
})

describe("legStatus", () => {
  it("flags walks that do not fit the gap", () => {
    expect(legStatus(10, 12)).toBe("tight")
    expect(legStatus(10, 7)).toBe("close")
    expect(legStatus(30, 7)).toBe("ok")
  })
})

describe("geometry helpers", () => {
  it("builds paths and bounds from flat rings", () => {
    const ring = [0, 0, 10, 0, 10, 5]
    expect(ringsPath([ring])).toBe("M0 0L10 0L10 5Z")
    expect(ringsBounds([ring])).toEqual([0, 0, 10, 5])
  })

  it("projects lon/lat to metres from the north-west corner", () => {
    const origin = {
      lon0: 103.675,
      lat1: 1.358,
      mPerLon: 111289,
      mPerLat: 111320
    }
    const [x, y] = project(origin, 103.676, 1.357)
    expect(x).toBeCloseTo(111.3, 0)
    expect(y).toBeCloseTo(111.3, 0)
  })

  it("names levels", () => {
    const data = {
      levels: [
        { z: -2, name: "B2" },
        { z: 4, name: "4" }
      ]
    } as VenueData
    expect(levelLabel(data, -2)).toBe("Basement 2")
    expect(levelLabel(data, 4)).toBe("Level 4")
    expect(levelLabel(data, 0)).toBe("Ground")
    expect(levelShort(data, -2)).toBe("B2")
    expect(levelShort(data, 4)).toBe("L4")
    expect(levelShort(data, 0)).toBe("G")
    expect(fmtMin(545)).toBe("09:05")
  })
})
