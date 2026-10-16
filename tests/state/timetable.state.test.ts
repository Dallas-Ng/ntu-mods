import { createTimetableSlice, TimetableSlice } from "@/state/timetable.state"
import { describe, expect, it } from "vitest"
import { createStore } from "zustand/vanilla"

import { DEFAULT_GENERATION_CONFIG } from "@/lib/generation-config"
import { SELECTABLE_SEMESTERS } from "@/lib/semesters"

const makeStore = () => createStore<TimetableSlice>(createTimetableSlice)

const gymCourse = (): Omit<CustomCourse, "id"> => ({
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

describe("timetable slice: timetable CRUD", () => {
  it("starts with 5 empty timetables at index 0", () => {
    const store = makeStore()
    expect(store.getState().timetables).toHaveLength(5)
    expect(store.getState().timetableIndex).toBe(0)
  })

  it("adds and removes an item from the current timetable only", () => {
    const store = makeStore()
    store.getState().addItemToTimetable("CZ2001", "A1")
    expect(store.getState().timetables[0]).toEqual({ CZ2001: "A1" })
    expect(store.getState().timetables[1]).toEqual({})

    store.getState().removeItemFromTimetable("CZ2001")
    expect(store.getState().timetables[0]).toEqual({})
  })

  it("updateItemIndex overwrites an existing module's selection", () => {
    const store = makeStore()
    store.getState().addItemToTimetable("CZ2001", "A1")
    store.getState().updateItemIndex("CZ2001", "A2")
    expect(store.getState().timetables[0].CZ2001).toBe("A2")
  })

  it("switching timetableIndex changes which slot subsequent edits touch", () => {
    const store = makeStore()
    store.getState().updateTimetableIndex(2)
    store.getState().addItemToTimetable("CZ2001", "A1")
    expect(store.getState().timetables[2]).toEqual({ CZ2001: "A1" })
    expect(store.getState().timetables[0]).toEqual({})
  })

  it("migrateTimetable replaces slot 0 and clears the rest", () => {
    const store = makeStore()
    store.getState().updateTimetable({ CZ2001: "A1" }, 1)
    store.getState().migrateTimetable({ CZ9999: "B1" })
    expect(store.getState().timetables[0]).toEqual({ CZ9999: "B1" })
    expect(store.getState().timetables[1]).toEqual({})
  })

  it("resetTimetables clears every timetable and custom course, and resets index", () => {
    const store = makeStore()
    store.getState().updateTimetableIndex(3)
    store.getState().addItemToTimetable("CZ2001", "A1")
    store.getState().addCustomCourse(gymCourse())

    store.getState().resetTimetables()

    expect(store.getState().timetables).toEqual([{}, {}, {}, {}, {}])
    expect(store.getState().customCourses).toEqual([[], [], [], [], []])
    expect(store.getState().timetableIndex).toBe(0)
  })
})

describe("timetable slice: duplicateTimetable", () => {
  it("copies the timetable and deep-clones custom courses with fresh ids", () => {
    const store = makeStore()
    store.getState().addItemToTimetable("CZ2001", "A1")
    store.getState().addCustomCourse(gymCourse())
    const originalCourseId = store.getState().customCourses[0][0].id

    store.getState().duplicateTimetable(0, 1)

    expect(store.getState().timetables[1]).toEqual({ CZ2001: "A1" })
    expect(store.getState().timetableIndex).toBe(1)
    expect(store.getState().customCourses[1]).toHaveLength(1)
    expect(store.getState().customCourses[1][0].id).not.toBe(originalCourseId)
    expect(store.getState().customCourses[1][0].name).toBe("Gym")
  })
})

describe("timetable slice: generation config", () => {
  it("updateGenerationConfig merges into the existing config", () => {
    const store = makeStore()
    store.getState().updateGenerationConfig({ maxConsecutiveSlots: 4 })
    expect(store.getState().generationConfig.maxConsecutiveSlots).toBe(4)
    expect(store.getState().generationConfig.dayStartTime).toBe(
      DEFAULT_GENERATION_CONFIG.dayStartTime
    )
  })

  it("resetGenerationConfig restores defaults and clears locked modules", () => {
    const store = makeStore()
    store.getState().updateGenerationConfig({ maxConsecutiveSlots: 4 })
    store.getState().toggleModuleLock("CZ2001")

    store.getState().resetGenerationConfig()

    expect(store.getState().generationConfig).toEqual(DEFAULT_GENERATION_CONFIG)
    expect(store.getState().lockedModules).toEqual([])
  })
})

describe("timetable slice: module lock toggle", () => {
  it("toggles a module lock on then off", () => {
    const store = makeStore()
    store.getState().toggleModuleLock("CZ2001")
    expect(store.getState().lockedModules).toEqual(["CZ2001"])
    store.getState().toggleModuleLock("CZ2001")
    expect(store.getState().lockedModules).toEqual([])
  })
})

describe("timetable slice: custom course CRUD", () => {
  it("addCustomCourse appends only to the current timetable slot", () => {
    const store = makeStore()
    store.getState().updateTimetableIndex(2)
    store.getState().addCustomCourse(gymCourse())
    expect(store.getState().customCourses[2]).toHaveLength(1)
    expect(store.getState().customCourses[0]).toHaveLength(0)
  })

  it("updateCustomCourse patches only the matching course", () => {
    const store = makeStore()
    store.getState().addCustomCourse(gymCourse())
    const id = store.getState().customCourses[0][0].id
    store.getState().updateCustomCourse(id, { name: "Renamed" })
    expect(store.getState().customCourses[0][0].name).toBe("Renamed")
  })

  it("removeCustomCourse drops only the matching course", () => {
    const store = makeStore()
    store.getState().addCustomCourse(gymCourse())
    store.getState().addCustomCourse({ ...gymCourse(), name: "Other" })
    const [keepId] = store.getState().customCourses[0].map((c) => c.id)
    store.getState().removeCustomCourse(keepId)
    expect(store.getState().customCourses[0]).toHaveLength(1)
    expect(store.getState().customCourses[0][0].name).toBe("Other")
  })

  it("selectCustomCourseIndex only accepts a variant id that belongs to the course", () => {
    const store = makeStore()
    store.getState().addCustomCourse({
      ...gymCourse(),
      indexes: [
        { id: "i1", label: "A", sessions: [] },
        { id: "i2", label: "B", sessions: [] }
      ]
    })
    const id = store.getState().customCourses[0][0].id

    store.getState().selectCustomCourseIndex(id, "i2")
    expect(store.getState().customCourses[0][0].selectedIndexId).toBe("i2")

    store.getState().selectCustomCourseIndex(id, "not-real")
    expect(store.getState().customCourses[0][0].selectedIndexId).toBe("i2")
  })

  it("setCustomCourses replaces the list for a specific timetable index", () => {
    const store = makeStore()
    store.getState().setCustomCourses([{ ...gymCourse(), id: "c1" }], 3)
    expect(store.getState().customCourses[3]).toHaveLength(1)
    expect(store.getState().customCourses[0]).toHaveLength(0)
  })
})

describe("timetable slice: remarks", () => {
  it("setModuleRemark stores a note, and clears it when set to blank", () => {
    const store = makeStore()
    store.getState().setModuleRemark("CZ2001", "bring laptop")
    expect(store.getState().moduleRemarks.CZ2001).toBe("bring laptop")

    store.getState().setModuleRemark("CZ2001", "   ")
    expect(store.getState().moduleRemarks.CZ2001).toBeUndefined()
  })

  it("setIndexRemark is keyed by moduleKey:indexKey and independent of moduleRemarks", () => {
    const store = makeStore()
    store.getState().setIndexRemark("CZ2001", "A1", "check venue")
    expect(store.getState().indexRemarks["CZ2001:A1"]).toBe("check venue")
    expect(store.getState().moduleRemarks.CZ2001).toBeUndefined()
  })
})

const [NEWER, OLDER] = SELECTABLE_SEMESTERS

describe("timetable slice: per-semester workspaces", () => {
  it("keeps timetables, locks and notes separate per semester", () => {
    const store = makeStore()
    store.getState().addItemToTimetable("CZ2001", "A1")
    store.getState().toggleModuleLock("CZ2001")
    store.getState().setModuleRemark("CZ2001", "good prof")

    store.getState().switchSemester(OLDER)
    expect(store.getState().semester).toBe(OLDER)
    expect(store.getState().timetables[0]).toEqual({})
    expect(store.getState().lockedModules).toEqual([])
    expect(store.getState().moduleRemarks).toEqual({})

    store.getState().addItemToTimetable("CZ1005", "B2")
    store.getState().switchSemester(NEWER)
    expect(store.getState().timetables[0]).toEqual({ CZ2001: "A1" })
    expect(store.getState().lockedModules).toEqual(["CZ2001"])
    expect(store.getState().moduleRemarks).toEqual({ CZ2001: "good prof" })

    store.getState().switchSemester(OLDER)
    expect(store.getState().timetables[0]).toEqual({ CZ1005: "B2" })
  })

  it("switching to the current semester changes nothing", () => {
    const store = makeStore()
    store.getState().addItemToTimetable("CZ2001", "A1")
    store.getState().switchSemester(NEWER)
    expect(store.getState().timetables[0]).toEqual({ CZ2001: "A1" })
  })

  it("parks and drops a semester that is no longer selectable", () => {
    const store = makeStore()
    store.getState().switchSemester(OLDER)
    store.setState({ semester: "2001;1" })
    store.getState().addItemToTimetable("CZ2001", "A1")
    store.getState().reconcileSemester()
    expect(store.getState().semester).toBe(NEWER)
    expect(store.getState().timetables[0]).toEqual({})
    expect(store.getState().semesterWorkspaces["2001;1"].timetables[0]).toEqual(
      {
        CZ2001: "A1"
      }
    )
  })

  it("assignSemester keeps the data and clears the pending flag", () => {
    const store = makeStore()
    store.setState({ pendingSemesterAssignment: true })
    store.getState().addItemToTimetable("CZ2001", "A1")
    store.getState().assignSemester(OLDER)
    expect(store.getState().semester).toBe(OLDER)
    expect(store.getState().pendingSemesterAssignment).toBe(false)
    expect(store.getState().timetables[0]).toEqual({ CZ2001: "A1" })
  })

  it("clearAllWorkspaces drops every semester's data", () => {
    const store = makeStore()
    store.getState().addItemToTimetable("CZ2001", "A1")
    store.getState().switchSemester(OLDER)
    store.getState().addItemToTimetable("CZ1005", "B2")
    store.setState({ pendingSemesterAssignment: true })
    store.getState().clearAllWorkspaces()
    expect(store.getState().timetables[0]).toEqual({})
    expect(store.getState().semesterWorkspaces).toEqual({})
    expect(store.getState().pendingSemesterAssignment).toBe(false)
  })
})
