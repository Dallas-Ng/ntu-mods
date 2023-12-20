import { StateCreator } from "zustand"

export interface CourseSlice {
  coursesToIndex: { [courseKey: string]: Index[] } // courseKey: indexKey
  addCourseToIndex: (courseKey: string, indexData: Index[]) => void
  removeCourseToIndex: (courseKey: string) => void
  resetCourseToIndex: () => void
}

export const createCourseSlice: StateCreator<CourseSlice> = (set) => ({
  coursesToIndex: {},
  addCourseToIndex: (courseKey: string, indexData: Index[]) =>
    set((state) => ({
      coursesToIndex: { ...state.coursesToIndex, [courseKey]: indexData }
    })),
  removeCourseToIndex: (courseKey: string) =>
    set((state) => {
      delete state.coursesToIndex[courseKey]
      return state
    }),
  resetCourseToIndex: () =>
    set((_state) => ({
      coursesToIndex: {}
    }))
})
