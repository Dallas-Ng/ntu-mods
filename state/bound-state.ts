import { create } from "zustand"
import { persist } from "zustand/middleware"

import { CourseSlice, createCourseSlice } from "./course.state"
import { SettingsSlice, createSettingsSlice } from "./setting.state"

interface StoreState extends CourseSlice, SettingsSlice {}

/**
 * Main state in the app
 */
export const useBoundState = create(
  persist<StoreState>( // persist state inside local storage
    (...a) => ({
      ...createCourseSlice(...a),
      ...createSettingsSlice(...a)
    }),
    {
      name: "dabao-store" // name of key in localstorage
      // skipHydration: true // TODO: enable this
    }
  )
)
