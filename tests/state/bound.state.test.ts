import { migrateBoundState } from "@/state/bound.state"
import { describe, expect, it } from "vitest"

describe("migrateBoundState", () => {
  it("normalizes legacy flat-session custom courses when migrating from before v1", () => {
    const legacyState = {
      customCourses: [
        [
          {
            id: "c1",
            name: "Gym",
            indexes: [],
            selectedIndexId: "",
            sessions: [
              { type: "Gym", day: 1, startTime: 700, endTime: 800, venue: "" }
            ]
          }
        ],
        [],
        [],
        [],
        []
      ]
    }

    const migrated = migrateBoundState(legacyState, 0)
    expect(migrated.customCourses[0][0].indexes).toHaveLength(1)
    expect(migrated.customCourses[0][0].indexes[0].sessions).toHaveLength(1)
  })

  it("leaves customCourses untouched once already at v1+", () => {
    const state = { customCourses: [[], [], [], [], []] }
    const migrated = migrateBoundState(state, 1)
    expect(migrated.customCourses).toBe(state.customCourses)
  })

  it("backfills moduleRemarks/indexRemarks when migrating from before v2", () => {
    const state = { customCourses: [[], [], [], [], []] }
    const migrated = migrateBoundState(state, 1)
    expect(migrated.moduleRemarks).toEqual({})
    expect(migrated.indexRemarks).toEqual({})
  })

  it("preserves existing moduleRemarks/indexRemarks once already at v2", () => {
    const state = {
      customCourses: [[], [], [], [], []],
      moduleRemarks: { CZ2001: "note" },
      indexRemarks: { "CZ2001:A1": "note2" }
    }
    const migrated = migrateBoundState(state, 2)
    expect(migrated.moduleRemarks).toEqual({ CZ2001: "note" })
    expect(migrated.indexRemarks).toEqual({ "CZ2001:A1": "note2" })
  })

  it("applies both migrations in sequence for a very old (v0) persisted state", () => {
    const state = {
      customCourses: [
        [
          {
            id: "c1",
            name: "Gym",
            indexes: [],
            selectedIndexId: "",
            sessions: []
          }
        ],
        [],
        [],
        [],
        []
      ]
    }
    const migrated = migrateBoundState(state, 0)
    expect(migrated.customCourses[0][0].indexes).toHaveLength(1)
    expect(migrated.moduleRemarks).toEqual({})
    expect(migrated.indexRemarks).toEqual({})
  })
})

describe("migrateBoundState: v3 per-semester plans", () => {
  it("flags existing timetable data for the keep-or-clear dialog", () => {
    const state = {
      timetables: [{ CZ2001: "A1" }, {}, {}, {}, {}],
      customCourses: [[], [], [], [], []],
      moduleRemarks: {},
      indexRemarks: {}
    }
    const migrated = migrateBoundState(state, 2)
    expect(migrated.pendingSemesterAssignment).toBe(true)
    expect(migrated.semester).toBeNull()
    expect(migrated.semesterWorkspaces).toEqual({})
    expect(migrated.timetables[0]).toEqual({ CZ2001: "A1" })
  })

  it("does not prompt a user who has nothing saved", () => {
    const state = {
      timetables: [{}, {}, {}, {}, {}],
      customCourses: [[], [], [], [], []],
      moduleRemarks: {},
      indexRemarks: {}
    }
    expect(migrateBoundState(state, 2).pendingSemesterAssignment).toBe(false)
  })

  it("counts notes and locks alone as data worth asking about", () => {
    const state = {
      timetables: [{}, {}, {}, {}, {}],
      customCourses: [[], [], [], [], []],
      lockedModules: ["CZ2001"],
      moduleRemarks: {},
      indexRemarks: {}
    }
    expect(migrateBoundState(state, 2).pendingSemesterAssignment).toBe(true)
  })

  it("leaves a v3 state alone", () => {
    const state = {
      timetables: [{ CZ2001: "A1" }, {}, {}, {}, {}],
      semester: "2026;1",
      semesterWorkspaces: {},
      pendingSemesterAssignment: false
    }
    const migrated = migrateBoundState(state, 3)
    expect(migrated.semester).toBe("2026;1")
    expect(migrated.pendingSemesterAssignment).toBe(false)
  })
})
