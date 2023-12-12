import { StateCreator } from "zustand"

export interface CourseSlice {
  courses: Course[]
  addCourse: (course: Course) => void
  removeCourse: (courseKey: string) => void
  //
  coursesToIndex: { [courseKey: string]: string } // courseKey: indexKey
  addCourseToIndex: (courseKey: string, indexKey: string) => void
  removeCourseToIndex: (courseKey: string, indexKey: string) => void
}

export const createCourseSlice: StateCreator<CourseSlice> = (set) => ({
  courses: [],
  addCourse: (course: Course) =>
    set((state) => ({ courses: [...state.courses, course] })),
  removeCourse: (courseKey: string) =>
    set((state) => ({
      courses: state.courses.filter((c) => c.key !== courseKey)
    })),
  //
  coursesToIndex: {},
  addCourseToIndex: (courseKey: string, indexKey: string) =>
    set((state) => ({
      coursesToIndex: { ...state.coursesToIndex, [courseKey]: indexKey }
    })),
  removeCourseToIndex: (courseKey: string) =>
    set((state) => {
      delete state.coursesToIndex[courseKey]
      return state
    })
})
