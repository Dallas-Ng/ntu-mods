import { create } from "zustand"
import { persist } from "zustand/middleware"

import { CourseSlice, createCourseSlice } from "./course.state"

interface StoreState extends CourseSlice {}

/**
 * Main state in the app
 */
export const useBoundState = create(
  persist<StoreState>( // persist state inside local storage
    (...a) => ({
      ...createCourseSlice(...a)
    }),
    {
      name: "dabao-store", // name of key in localstorage
      skipHydration: true // TODO: enable this
    }
  )
)
