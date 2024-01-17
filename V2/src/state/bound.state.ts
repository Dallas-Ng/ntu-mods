import { create } from "zustand"
import { persist } from "zustand/middleware"

import { SettingsSlice, createSettingsSlice } from "./settings.state"
import { TimetableSlice, createTimetableSlice } from "./timetable.state"

interface StoreState extends TimetableSlice, SettingsSlice {}

/**
 * Main state in the app
 */
export const useBoundState = create(
  persist<StoreState>(
    (...a) => ({
      ...createTimetableSlice(...a),
      ...createSettingsSlice(...a)
    }),
    { name: "ntu-mods" }
  )
)
