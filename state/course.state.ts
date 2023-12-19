import { StateCreator } from "zustand"

export interface CourseSlice {
  courses: Course[]
  addCourse: (course: Course) => void
  removeCourse: (courseKey: string) => void
  resetCourses: () => void
  //
  coursesToIndex: { [courseKey: string]: Index[] } // courseKey: indexKey
  addCourseToIndex: (courseKey: string, indexData: Index[]) => void
  removeCourseToIndex: (courseKey: string) => void
  resetCourseToIndex: () => void
}

export const createCourseSlice: StateCreator<CourseSlice> = (set) => ({
  courses: [],
  addCourse: (course: Course) =>
    set((state) => ({ courses: [...state.courses, course] })),
  removeCourse: (courseKey: string) =>
    set((state) => ({
      courses: state.courses.filter((c) => c.key !== courseKey)
    })),
  resetCourses: () => set((_state) => ({ courses: [] })),
  //
  coursesToIndex: {},
  addCourseToIndex: (courseKey: string, indexData: Index[]) =>
    set((state) => ({
      coursesToIndex: { ...state.coursesToIndex, [courseKey]: indexData }
    })),
  removeCourseToIndex: (courseKey: string) =>
    set((state) => {
      state.courses.filter((c) => c.key !== courseKey)
      delete state.coursesToIndex[courseKey]
      return state
    }),
  resetCourseToIndex: () =>
    set((_state) => ({
      coursesToIndex: {}
    }))
})
