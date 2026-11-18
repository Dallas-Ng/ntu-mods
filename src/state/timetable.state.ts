import { StateCreator } from "zustand"

import { cloneCustomCourse } from "@/lib/custom-course-migrate"
import { DEFAULT_GENERATION_CONFIG } from "@/lib/generation-config"

export interface TimetableSlice {
  timetables: Timetable[]
  timetableIndex: number
  /** Names the student gave their plans; "" keeps the default "Plan N". */
  planNames: string[]
  timetableCreationMode: TimetableCreationMode
  generationConfig: GenerationConfig
  /**
   * Generation-time toggle: count only distinct timeslot layouts towards the
   * result limit, instead of filtering look-alikes out of an already-capped
   * batch (which threw away the layouts that never got generated).
   */
  uniqueTimeslotsOnly: boolean
  lockedModules: string[]
  /**
   * Module keys hidden from the grid and the map, one list per plan. A
   * hidden module stays registered: it keeps its index and still counts
   * for generation, it is only not drawn.
   */
  hiddenModules: string[][]
  hasOnboarded: boolean
  customCourses: CustomCourse[][]
  /** User notes, keyed by moduleKey. Not sourced from STARS — user-owned. */
  moduleRemarks: Record<string, string>
  /** User notes for a specific index/group, keyed by `${moduleKey}:${indexKey}`. */
  indexRemarks: Record<string, string>
  migrateTimetable: (timetable: Timetable) => void
  updateTimetable: (timetable: Timetable, timetableIndex: number) => void
  addItemToTimetable: (moduleKey: string, indexKey: string) => void
  updateItemIndex: (moduleKey: string, indexKey: string) => void
  removeItemFromTimetable: (moduleKey: string) => void
  updateTimetableIndex: (timetableIndex: number) => void
  setPlanName: (index: number, name: string) => void
  duplicateTimetable: (fromIndex: number, toIndex: number) => void
  resetTimetables: () => void
  setTimetableCreationMode: (mode: TimetableCreationMode) => void
  updateGenerationConfig: (config: Partial<GenerationConfig>) => void
  resetGenerationConfig: () => void
  setUniqueTimeslotsOnly: (value: boolean) => void
  toggleModuleLock: (moduleKey: string) => void
  toggleModuleHidden: (moduleKey: string) => void
  setHasOnboarded: (value: boolean) => void
  addCustomCourse: (course: Omit<CustomCourse, "id">) => void
  updateCustomCourse: (
    id: string,
    updates: Partial<Omit<CustomCourse, "id">>
  ) => void
  removeCustomCourse: (id: string) => void
  selectCustomCourseIndex: (courseId: string, courseIndexId: string) => void
  setCustomCourses: (courses: CustomCourse[], timetableIndex: number) => void
  setModuleRemark: (moduleKey: string, remark: string) => void
  setIndexRemark: (moduleKey: string, indexKey: string, remark: string) => void
}

export const createTimetableSlice: StateCreator<TimetableSlice> = (set) => ({
  timetables: [{}, {}, {}, {}, {}],
  timetableIndex: 0,
  planNames: ["", "", "", "", ""],
  timetableCreationMode: "default",
  generationConfig: DEFAULT_GENERATION_CONFIG,
  uniqueTimeslotsOnly: true,
  lockedModules: [],
  hiddenModules: [[], [], [], [], []],
  hasOnboarded: false,
  customCourses: [[], [], [], [], []],
  moduleRemarks: {},
  indexRemarks: {},
  migrateTimetable: (timetable: Timetable) =>
    set((state) => ({
      timetables: [{ ...timetable }, {}, {}, {}, {}],
      hiddenModules: setHiddenForPlan(state.hiddenModules, 0, (list) =>
        list.filter((key) => key in timetable)
      )
    })),
  updateTimetable: (timetable: Timetable, timetableIndex: number) => {
    set((state) => {
      const updatedTimetables = [...state.timetables]
      const updatedTimetable = { ...timetable }

      updatedTimetables[timetableIndex] = updatedTimetable

      return {
        ...state,
        timetables: updatedTimetables,
        hiddenModules: setHiddenForPlan(
          state.hiddenModules,
          timetableIndex,
          (list) => list.filter((key) => key in updatedTimetable)
        )
      }
    })
  },
  addItemToTimetable: (moduleKey: string, indexKey: string) => {
    set((state) => {
      const currentTimetable = state.timetables[state.timetableIndex]
      const updatedTimetable = {
        ...currentTimetable,
        [moduleKey]: indexKey
      }

      // Check if there are changes; if not, return the current state
      if (currentTimetable === updatedTimetable) {
        return state
      }

      const updatedTimetables = [...state.timetables]
      updatedTimetables[state.timetableIndex] = updatedTimetable

      // Re-adding a module through search brings it back out of hiding.
      return {
        ...state,
        timetables: updatedTimetables,
        hiddenModules: setHiddenForPlan(
          state.hiddenModules,
          state.timetableIndex,
          (list) => list.filter((key) => key !== moduleKey)
        )
      }
    })
  },
  removeItemFromTimetable: (moduleKey: string) => {
    set((state) => {
      const updatedTimetables = [...state.timetables] // Create a shallow copy of timetables
      const updatedTimetable = { ...updatedTimetables[state.timetableIndex] } // Create a shallow copy of the specific timetable

      delete updatedTimetable[moduleKey]

      updatedTimetables[state.timetableIndex] = updatedTimetable

      return {
        ...state,
        timetables: updatedTimetables,
        hiddenModules: setHiddenForPlan(
          state.hiddenModules,
          state.timetableIndex,
          (list) => list.filter((key) => key !== moduleKey)
        )
      }
    })
  },
  updateItemIndex: (moduleKey: string, indexKey: string) => {
    set((state) => {
      const updatedTimetables = [...state.timetables]
      const updatedTimetable = { ...updatedTimetables[state.timetableIndex] }

      updatedTimetable[moduleKey] = indexKey

      updatedTimetables[state.timetableIndex] = updatedTimetable

      return { ...state, timetables: updatedTimetables }
    })
  },
  updateTimetableIndex: (timetableIndex: number) => {
    set((_state) => ({ timetableIndex }))
  },
  setPlanName: (index, name) =>
    set((state) => {
      // Saved states from before plans had names have no array yet.
      const planNames = Array.from(
        { length: state.timetables.length },
        (_, i) => state.planNames?.[i] ?? ""
      )
      planNames[index] = name.trim().slice(0, 20)
      return { planNames }
    }),
  duplicateTimetable: (fromIndex, toIndex) =>
    set((state) => {
      const updatedTimetables = [...state.timetables]
      updatedTimetables[toIndex] = { ...state.timetables[fromIndex] }
      const updatedCustomCourses = [...state.customCourses]
      updatedCustomCourses[toIndex] = (
        state.customCourses[fromIndex] ?? []
      ).map(cloneCustomCourse)
      return {
        timetables: updatedTimetables,
        customCourses: updatedCustomCourses,
        hiddenModules: setHiddenForPlan(state.hiddenModules, toIndex, () => [
          ...(state.hiddenModules?.[fromIndex] ?? [])
        ]),
        timetableIndex: toIndex
      }
    }),
  resetTimetables: () => {
    set((_state) => ({
      timetables: [{}, {}, {}, {}, {}],
      timetableIndex: 0,
      planNames: ["", "", "", "", ""],
      customCourses: [[], [], [], [], []],
      hiddenModules: [[], [], [], [], []]
    }))
  },
  setTimetableCreationMode: (mode: TimetableCreationMode) => {
    set((_state) => ({ timetableCreationMode: mode }))
  },
  updateGenerationConfig: (config: Partial<GenerationConfig>) => {
    set((state) => ({
      generationConfig: { ...state.generationConfig, ...config }
    }))
  },
  /**
   * Index locks are edited inside the same settings modal, so a reset that left
   * them pinned would keep constraining generation after the user asked for a
   * clean slate.
   */
  resetGenerationConfig: () => {
    set((_state) => ({
      generationConfig: DEFAULT_GENERATION_CONFIG,
      lockedModules: []
    }))
  },
  setUniqueTimeslotsOnly: (value: boolean) => {
    set((_state) => ({ uniqueTimeslotsOnly: value }))
  },
  toggleModuleLock: (moduleKey: string) => {
    set((state) => ({
      lockedModules: state.lockedModules.includes(moduleKey)
        ? state.lockedModules.filter((k) => k !== moduleKey)
        : [...state.lockedModules, moduleKey]
    }))
  },
  toggleModuleHidden: (moduleKey: string) => {
    set((state) => ({
      hiddenModules: setHiddenForPlan(
        state.hiddenModules,
        state.timetableIndex,
        (list) =>
          list.includes(moduleKey)
            ? list.filter((key) => key !== moduleKey)
            : [...list, moduleKey]
      )
    }))
  },
  setHasOnboarded: (value: boolean) => {
    set((_state) => ({ hasOnboarded: value }))
  },
  addCustomCourse: (course) => {
    set((state) => {
      const id = crypto.randomUUID()
      const updated = state.customCourses.map((list, i) =>
        i === state.timetableIndex ? [...list, { ...course, id }] : list
      )
      return { customCourses: updated }
    })
  },
  updateCustomCourse: (id, updates) => {
    set((state) => {
      const updated = state.customCourses.map((list, i) =>
        i === state.timetableIndex
          ? list.map((c) => (c.id === id ? { ...c, ...updates } : c))
          : list
      )
      return { customCourses: updated }
    })
  },
  removeCustomCourse: (id) => {
    set((state) => {
      const updated = state.customCourses.map((list, i) =>
        i === state.timetableIndex ? list.filter((c) => c.id !== id) : list
      )
      return { customCourses: updated }
    })
  },
  selectCustomCourseIndex: (courseId, courseIndexId) => {
    set((state) => {
      const updated = state.customCourses.map((list, i) =>
        i === state.timetableIndex
          ? list.map((c) =>
              c.id === courseId && c.indexes.some((x) => x.id === courseIndexId)
                ? { ...c, selectedIndexId: courseIndexId }
                : c
            )
          : list
      )
      return { customCourses: updated }
    })
  },
  setCustomCourses: (courses, timetableIndex) => {
    set((state) => {
      const updated = [...state.customCourses]
      updated[timetableIndex] = courses
      return { customCourses: updated }
    })
  },
  setModuleRemark: (moduleKey, remark) => {
    set((state) => ({
      moduleRemarks: setRemark(state.moduleRemarks, moduleKey, remark)
    }))
  },
  setIndexRemark: (moduleKey, indexKey, remark) => {
    set((state) => ({
      indexRemarks: setRemark(
        state.indexRemarks,
        `${moduleKey}:${indexKey}`,
        remark
      )
    }))
  }
})

const setRemark = (
  remarks: Record<string, string>,
  key: string,
  remark: string
) => {
  const updated = { ...remarks }
  if (remark.trim() === "") delete updated[key]
  else updated[key] = remark
  return updated
}

/** Rewrites one plan's hidden list, keeping every other plan untouched. */
const setHiddenForPlan = (
  hiddenModules: string[][] | undefined,
  plan: number,
  update: (list: string[]) => string[]
) =>
  Array.from({ length: 5 }, (_, i) =>
    i === plan ? update(hiddenModules?.[i] ?? []) : (hiddenModules?.[i] ?? [])
  )
