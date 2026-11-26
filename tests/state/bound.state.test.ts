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

  it("backfills per-plan hiddenModules when migrating from before v3", () => {
    const state = {
      timetables: [{}, {}, {}, {}, {}],
      customCourses: [[], [], [], [], []]
    }
    const migrated = migrateBoundState(state, 2)
    expect(migrated.hiddenModules).toEqual([[], [], [], [], []])
  })

  it("preserves existing hiddenModules once already at v3", () => {
    const state = {
      timetables: [{}, {}, {}, {}, {}],
      hiddenModules: [["CZ2001"], [], [], [], []]
    }
    const migrated = migrateBoundState(state, 3)
    expect(migrated.hiddenModules).toEqual([["CZ2001"], [], [], [], []])
  })

  it("backfills appearance colour fields when migrating from before v4", () => {
    const state = {
      timetables: [{}, {}, {}, {}, {}],
      settings: { appearance: { radius: 12, timetableStyle: "classic" } }
    }
    const migrated = migrateBoundState(state, 3)
    expect(migrated.settings.appearance).toMatchObject({
      radius: 12,
      typeOverrides: {},
      moduleOverrides: {},
      granularColors: false
    })
  })

  it("leaves state without settings alone at v3", () => {
    const migrated = migrateBoundState({ timetables: [{}] }, 3)
    expect(migrated.settings).toBeUndefined()
  })
})
