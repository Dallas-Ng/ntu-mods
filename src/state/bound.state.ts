import { create } from "zustand"
import { persist } from "zustand/middleware"

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
    { name: "ntu-mods" }
  )
)
