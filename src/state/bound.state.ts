import { create } from "zustand"
import { persist } from "zustand/middleware"

import { normalizeCustomCourses } from "@/lib/custom-course-migrate"

import { createFavouritesSlice, FavouritesSlice } from "./favourites.state"
import { createSettingsSlice, SettingsSlice } from "./settings.state"
import { createTimetableSlice, TimetableSlice } from "./timetable.state"

interface StoreState extends TimetableSlice, SettingsSlice, FavouritesSlice {}

/**
 * Main state in the app
 */
export const useBoundState = create(
  persist<StoreState>(
    (...a) => ({
      ...createTimetableSlice(...a),
      ...createSettingsSlice(...a),
      ...createFavouritesSlice(...a)
    }),
    {
      name: "ntu-mods",
      version: 1,
      migrate: (persistedState, version) => {
        const state = persistedState as StoreState

        // v1: custom blocks gained multiple indexes (variants)
        if (version < 1) {
          state.customCourses = normalizeCustomCourses(state.customCourses)
        }

        return state
      }
    }
  )
)
