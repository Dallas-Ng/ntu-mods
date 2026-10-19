import { describe, expect, it } from "vitest"

import { searchPlaces, type Searchable } from "@/lib/place-search"

const p = (
  name: string,
  sub = "",
  extra: Partial<Searchable> = {}
): Searchable => ({ name, sub, kind: "landmark", ...extra })

const PLACES = [
  p("Gym Room 1 (SRC)", "Sports · Level 1", { alias: "sports gym fitness" }),
  p("Anytime Fitness Gym (The Wave)", "Sports", {
    alias: "sports gym fitness"
  }),
  p("Swimming Pool (NIE)", "Sports", { alias: "sports fitness" }),
  p("LT19A", "LT19A (NS)", { kind: "venue", weight: 300 }),
  p("LT1", "Von Lee Yong Miang Lecture Theatre", { kind: "venue" }),
  p("Hall 2", "Halls of residence", { alias: "hostel dorm" }),
  p("Car Park A", "Car parks", { alias: "car park carpark parking" })
]

describe("searchPlaces", () => {
  it("finds gyms first, then related sports places", () => {
    const names = searchPlaces(PLACES, "gym").map((x) => x.name)
    expect(names.slice(0, 2).sort()).toEqual([
      "Anytime Fitness Gym (The Wave)",
      "Gym Room 1 (SRC)"
    ])
    expect(names[2]).toBe("Swimming Pool (NIE)")
  })

  it("understands what students call things", () => {
    expect(searchPlaces(PLACES, "swim")[0].name).toBe("Swimming Pool (NIE)")
    expect(searchPlaces(PLACES, "hostel")[0].name).toBe("Hall 2")
    expect(searchPlaces(PLACES, "carpark")[0].name).toBe("Car Park A")
  })

  it("matches room codes by prefix and puts the exact code first", () => {
    expect(searchPlaces(PLACES, "lt1").map((x) => x.name)).toEqual([
      "LT1",
      "LT19A"
    ])
    expect(searchPlaces(PLACES, "lt19a")[0].name).toBe("LT19A")
  })

  it("needs every word to match and ignores empty queries", () => {
    expect(searchPlaces(PLACES, "gym xyz")).toEqual([])
    expect(searchPlaces(PLACES, "  ")).toEqual([])
  })
})
