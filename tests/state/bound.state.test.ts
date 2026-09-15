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
