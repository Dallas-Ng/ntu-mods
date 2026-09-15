import { describe, expect, it } from "vitest"

import { customCourseModuleKey } from "./custom-course-colors"
import {
  customCoursesToAllIndexes,
  customCoursesToIcsInputs,
  customCoursesToIndexMap,
  getSelectedCustomCourseIndex
} from "./custom-course-to-index"

const gymCourse = (): CustomCourse => ({
  id: "c1",
  name: "Gym",
  selectedIndexId: "i1",
  indexes: [
    {
      id: "i1",
      label: "Option A",
      sessions: [
        { type: "Gym", day: 1, startTime: 700, endTime: 830, venue: "Hall" }
      ]
    },
    {
      id: "i2",
      label: "Option B",
      sessions: [
        { type: "LEC", day: 2, startTime: 900, endTime: 1000, venue: "" }
      ]
    }
  ]
})

describe("getSelectedCustomCourseIndex", () => {
  it("returns the variant matching selectedIndexId", () => {
    const course = gymCourse()
    expect(getSelectedCustomCourseIndex(course)?.id).toBe("i1")
  })

  it("falls back to the first variant when selectedIndexId is stale", () => {
    const course = { ...gymCourse(), selectedIndexId: "missing" }
    expect(getSelectedCustomCourseIndex(course)?.id).toBe("i1")
  })
})

describe("customCoursesToIndexMap", () => {
  it("converts the selected variant's sessions into slots, keyed by the course's module key", () => {
    const map = customCoursesToIndexMap([gymCourse()])
    const slots = map[customCourseModuleKey("c1")]
    expect(slots).toHaveLength(1)
    expect(slots[0]).toMatchObject({
      key: "i1",
      day: 1,
      time: "0700-0830",
      venue: "Hall",
      isCustom: true
    })
  })

  it("maps a free-text session type to LEC and preserves it in remarks", () => {
    const map = customCoursesToIndexMap([gymCourse()])
    const slot = map[customCourseModuleKey("c1")][0]
    expect(slot.type).toBe("LEC")
    expect(slot.remarks).toBe("Gym")
  })

  it("computes duration in 30-minute units", () => {
    const map = customCoursesToIndexMap([gymCourse()])
    // 0700-0830 = 90 minutes = 3 units
    expect(map[customCourseModuleKey("c1")][0].duration).toBe(3)
  })

  it("skips a course whose selected variant has no sessions", () => {
    const empty: CustomCourse = {
      id: "c2",
      name: "Empty",
      selectedIndexId: "i1",
      indexes: [{ id: "i1", label: "A", sessions: [] }]
    }
    const map = customCoursesToIndexMap([empty])
    expect(map[customCourseModuleKey("c2")]).toBeUndefined()
  })
})

describe("customCoursesToIcsInputs", () => {
  it("builds self-referencing timetable/lookup entries for each block", () => {
    const { timetable, indexLookup, titleLookup, labelLookup } =
      customCoursesToIcsInputs([gymCourse()])
    const key = customCourseModuleKey("c1")
    expect(timetable[key]).toBe(key)
    expect(indexLookup[key]).toHaveLength(1)
    expect(titleLookup[key]).toBe("Gym")
    expect(labelLookup[key]).toBe("Gym")
  })
})

describe("customCoursesToAllIndexes", () => {
  it("includes every variant, not just the selected one", () => {
    const all = customCoursesToAllIndexes([gymCourse()])
    const indexes = all[customCourseModuleKey("c1")]
    expect(Object.keys(indexes).sort()).toEqual(["i1", "i2"])
  })

  it("omits variants with no sessions and drops the course if none remain", () => {
    const noSessions: CustomCourse = {
      id: "c3",
      name: "NoSessions",
      selectedIndexId: "i1",
      indexes: [{ id: "i1", label: "A", sessions: [] }]
    }
    const all = customCoursesToAllIndexes([noSessions])
    expect(all[customCourseModuleKey("c3")]).toBeUndefined()
  })
})
