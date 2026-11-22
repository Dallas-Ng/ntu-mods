import { describe, expect, it } from "vitest"

import {
  dayStops,
  findStopClashes,
  fmtMin,
  formatOtherVenues,
  legStatus,
  levelLabel,
  levelShort,
  project,
  reverseWalk,
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

const slot = (
  day: number,
  time: string,
  venueKey: string,
  overrides: Partial<Index> = {}
): Index => ({
  key: "1",
  type: "LEC",
  group: "A",
  day,
  time,
  venue: venueKey,
  remarks: "",
  duration: 2,
  ...overrides
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

  it("folds same-slot online and alternate-week variations into one physical stop", () => {
    const tt: TimetableWithIndex = {
      SC1006: [
        slot(3, "1130-1220", "ONLINE", {
          key: "10060",
          remarks: "Teaching Wk10"
        }),
        slot(3, "1130-1220", "LT1A", {
          key: "10060",
          remarks: "Teaching Wk1-9,11-13"
        })
      ],
      SC1002: [
        slot(3, "1230-1320", "ONLINE", {
          key: "10010",
          remarks: "Teaching Wk10"
        }),
        slot(3, "1230-1320", "LT28", { key: "10010", remarks: "Teaching Wk7" }),
        slot(3, "1230-1320", "LT2A", {
          key: "10010",
          remarks: "Teaching Wk1-6,8,9,11,12"
        }),
        slot(3, "1230-1320", "LKC-LT", {
          key: "10010",
          remarks: "Teaching Wk7"
        })
      ]
    }
    const stops = dayStops(tt, 3, {
      LT1A: venue("LT1A"),
      LT2A: venue("LT2A"),
      LT28: venue("LT28"),
      "LKC-LT": venue("LKC-LT")
    })
    expect(stops).toHaveLength(2)
    expect(stops[0].code).toBe("SC1006")
    expect(stops[0].venueKey).toBe("LT1A")
    expect(stops[0].weeks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
    expect(stops[0].physicalWeeks).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13
    ])
    expect(formatOtherVenues(stops[0].otherVenues, stops[0].remarks)).toEqual([
      "online Wk10"
    ])

    expect(stops[1].code).toBe("SC1002")
    expect(stops[1].venueKey).toBe("LT2A")
    expect(formatOtherVenues(stops[1].otherVenues, stops[1].remarks)).toEqual([
      "LT28, LKC-LT Wk7",
      "online Wk10"
    ])
    expect(findStopClashes(stops).pairs).toBe(0)
  })

  it("prefers a physical venue even when ONLINE has more weeks", () => {
    const tt: TimetableWithIndex = {
      BS1005: [
        slot(1, "1630-1820", "ONLINE", {
          key: "08528",
          remarks: "Teaching Wk1,2,6,8-13"
        }),
        slot(1, "1630-1820", "LT19A", {
          key: "08528",
          remarks: "Teaching Wk3,4,7"
        })
      ]
    }
    const stops = dayStops(tt, 1, { LT19A: venue("LT19A") })
    expect(stops).toHaveLength(1)
    expect(stops[0].venueKey).toBe("LT19A")
    expect(stops[0].physicalWeeks).toEqual([3, 4, 7])
    expect(formatOtherVenues(stops[0].otherVenues, stops[0].remarks)).toEqual([
      "online Wk1,2,6,8-13"
    ])
  })

  it("summarises many same-week alternate rooms concisely", () => {
    const tt: TimetableWithIndex = {
      AB2008: [
        slot(4, "0830-1220", "CR1", {
          key: "01090",
          remarks: "Teaching Wk2-9,11-13"
        }),
        slot(4, "0830-1220", "LHS-TR+29", {
          key: "01090",
          remarks: "Teaching Wk2-9,11-13"
        }),
        slot(4, "0830-1220", "LHS-TR+32", {
          key: "01090",
          remarks: "Teaching Wk2-9,11-13"
        }),
        slot(4, "0830-1220", "LT26", {
          key: "01090",
          remarks: "Teaching Wk2-9,11-13"
        })
      ]
    }
    const stops = dayStops(tt, 4, {
      "LHS-TR+29": venue("LHS-TR+29"),
      "LHS-TR+32": venue("LHS-TR+32"),
      LT26: venue("LT26")
    })
    expect(stops).toHaveLength(1)
    expect(stops[0].venueKey).toBe("LHS-TR+29")
    expect(formatOtherVenues(stops[0].otherVenues, stops[0].remarks)).toEqual([
      "+3 rooms"
    ])
  })
})

describe("findStopClashes", () => {
  it("ignores time overlaps on disjoint teaching weeks", () => {
    const tt: TimetableWithIndex = {
      SC2003: [
        slot(1, "0830-1020", "SWLAB3", {
          type: "LAB",
          remarks: "Teaching Wk1,3,5,7,9,11,13"
        })
      ],
      SC2005: [
        slot(1, "0830-1020", "HWLAB2", {
          type: "LAB",
          remarks: "Teaching Wk2,4,6,8,10,12"
        })
      ]
    }
    const stops = dayStops(tt, 1, {})
    expect(findStopClashes(stops).pairs).toBe(0)
  })

  it("still flags real overlaps on shared teaching weeks", () => {
    const tt: TimetableWithIndex = {
      SC1008: [
        slot(3, "1630-1720", "ONLINE", {
          key: "10131",
          type: "LEC",
          remarks: "Teaching Wk10"
        }),
        slot(3, "1630-1720", "LT1A", {
          key: "10131",
          type: "LEC",
          remarks: "Teaching Wk1-9,11-13"
        })
      ],
      ML0004: [
        slot(3, "1630-1820", "LHN-TR+12", {
          key: "83056",
          type: "TUT",
          remarks: "Teaching Wk1-4,6,7,9,11-13"
        })
      ]
    }
    const stops = dayStops(tt, 3, {
      LT1A: venue("LT1A"),
      "LHN-TR+12": venue("LHN-TR+12")
    })
    expect(stops).toHaveLength(2)
    const clashes = findStopClashes(stops)
    expect(clashes.pairs).toBe(1)
    expect(clashes.withCodes.get(stops[0].id)).toEqual(["ML0004 TUT"])
    expect(clashes.withCodes.get(stops[1].id)).toEqual(["SC1008 LEC"])
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

describe("reverseWalk", () => {
  const walk = {
    metres: 100,
    seconds: 80,
    segments: [
      { z: 1, pts: [1, 2, 3, 4] },
      { z: 0, pts: [3, 4, 5, 6] }
    ],
    changes: [{ lon: 3, lat: 4, from: 1, to: 0, stairs: true }]
  }

  it("flips the path, the levels and the order", () => {
    const back = reverseWalk(walk)
    expect(back.segments).toEqual([
      { z: 0, pts: [5, 6, 3, 4] },
      { z: 1, pts: [3, 4, 1, 2] }
    ])
    expect(back.changes).toEqual([
      { lon: 3, lat: 4, from: 0, to: 1, stairs: true }
    ])
    expect(back.seconds).toBe(80)
  })

  it("is its own inverse", () => {
    expect(reverseWalk(reverseWalk(walk))).toEqual(walk)
  })
})
