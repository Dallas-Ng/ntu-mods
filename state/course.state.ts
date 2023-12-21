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
      const stateCopy = { ...state }
      delete stateCopy.coursesToIndex[courseKey]
      return stateCopy
    }),
  resetCourseToIndex: () =>
    set((_state) => ({
      coursesToIndex: {}
    }))
})
