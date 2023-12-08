import { StateCreator } from "zustand"

export interface CourseSlice {
  courses: Course[]
  addCourse: (course: Course) => void
  removeCourse: (courseKey: string) => void
}

export const createCourseSlice: StateCreator<CourseSlice> = (set) => ({
  courses: [],
  addCourse: (course: Course) =>
    set((state) => {
      const existingCourse = state.courses.find((c) => c.key === course.key)
      if (!existingCourse) state.courses = [...state.courses, course]
      return state
    }),
  removeCourse: (courseKey: string) =>
    set((state) => ({
      courses: state.courses.filter((c) => c.key !== courseKey)
    }))
})
