import { describe, expect, it } from "vitest"

import {
  cloneCustomCourse,
  DEFAULT_CUSTOM_INDEX_LABEL,
  normalizeCustomCourse,
  normalizeCustomCourses
} from "@/lib/custom-course-migrate"

const session = (): CustomCourseSession => ({
  type: "Gym",
  day: 1,
  startTime: 700,
  endTime: 800,
  venue: "Hall"
})

describe("normalizeCustomCourse", () => {
  it("folds a legacy flat `sessions` array into a single default variant", () => {
    const legacy = {
      id: "c1",
      name: "Gym",
      indexes: [],
      selectedIndexId: "",
      sessions: [session()]
    } as unknown as CustomCourse

    const normalized = normalizeCustomCourse(legacy)
    expect(normalized.indexes).toHaveLength(1)
    expect(normalized.indexes[0].label).toBe(DEFAULT_CUSTOM_INDEX_LABEL)
    expect(normalized.indexes[0].sessions).toEqual([session()])
    expect(normalized.selectedIndexId).toBe(normalized.indexes[0].id)
  })

  it("leaves an already-migrated course's indexes untouched", () => {
    const course: CustomCourse = {
      id: "c1",
      name: "Gym",
      selectedIndexId: "i1",
      indexes: [{ id: "i1", label: "Option A", sessions: [session()] }]
    }
    const normalized = normalizeCustomCourse(course)
    expect(normalized.indexes).toBe(course.indexes)
    expect(normalized.selectedIndexId).toBe("i1")
  })

  it("resets selectedIndexId to the first variant when it points at nothing", () => {
    const course: CustomCourse = {
      id: "c1",
      name: "Gym",
      selectedIndexId: "stale",
      indexes: [{ id: "i1", label: "Option A", sessions: [session()] }]
    }
    expect(normalizeCustomCourse(course).selectedIndexId).toBe("i1")
  })

  it("produces an empty default variant when there are no sessions to migrate", () => {
    const bare = {
      id: "c1",
      name: "Empty",
      indexes: [],
      selectedIndexId: ""
    } as unknown as CustomCourse
    const normalized = normalizeCustomCourse(bare)
    expect(normalized.indexes[0].sessions).toEqual([])
  })
})

describe("normalizeCustomCourses", () => {
  it("normalizes every course in every timetable slot", () => {
    const legacy = [
      [
        {
          id: "c1",
          name: "Gym",
          indexes: [],
          selectedIndexId: "",
          sessions: [session()]
        } as unknown as CustomCourse
      ],
      [],
      [],
      [],
      []
    ]
    const result = normalizeCustomCourses(legacy)
    expect(result).toHaveLength(5)
    expect(result[0][0].indexes).toHaveLength(1)
  })

  it("defaults to five empty timetable slots when given undefined", () => {
    expect(normalizeCustomCourses(undefined)).toEqual([[], [], [], [], []])
  })
})

describe("cloneCustomCourse", () => {
  it("deep-copies a course with fresh ids at every level", () => {
    const course: CustomCourse = {
      id: "c1",
      name: "Gym",
      selectedIndexId: "i1",
      indexes: [{ id: "i1", label: "Option A", sessions: [session()] }]
    }
    const clone = cloneCustomCourse(course)

    expect(clone.id).not.toBe(course.id)
    expect(clone.indexes[0].id).not.toBe(course.indexes[0].id)
    expect(clone.indexes[0].sessions[0]).toEqual(course.indexes[0].sessions[0])
    expect(clone.indexes[0].sessions[0]).not.toBe(course.indexes[0].sessions[0])
    expect(clone.selectedIndexId).toBe(clone.indexes[0].id)
  })

  it("preserves which variant was selected across the id remap", () => {
    const course: CustomCourse = {
      id: "c1",
      name: "Gym",
      selectedIndexId: "i2",
      indexes: [
        { id: "i1", label: "Option A", sessions: [session()] },
        { id: "i2", label: "Option B", sessions: [session()] }
      ]
    }
    const clone = cloneCustomCourse(course)
    expect(clone.selectedIndexId).toBe(clone.indexes[1].id)
  })
})
