import { create } from "zustand"
import { persist } from "zustand/middleware"

import { normalizeCustomCourses } from "@/lib/custom-course-migrate"

import { createFavouritesSlice, FavouritesSlice } from "./favourites.state"
import { createSettingsSlice, SettingsSlice } from "./settings.state"
import { createTimetableSlice, TimetableSlice } from "./timetable.state"

interface StoreState extends TimetableSlice, SettingsSlice, FavouritesSlice {}

export const migrateBoundState = (
  persistedState: unknown,
  version: number
): StoreState => {
  const state = persistedState as StoreState

  // v1: custom blocks gained multiple indexes (variants)
  if (version < 1) {
    state.customCourses = normalizeCustomCourses(state.customCourses)
  }

  // v2: user-owned per-module/per-index remarks
  if (version < 2) {
    state.moduleRemarks = state.moduleRemarks ?? {}
    state.indexRemarks = state.indexRemarks ?? {}
  }

  return state
}

const useBoundStore = create(
  persist<StoreState>(
    (...a) => {
      const initialState = {
        ...createTimetableSlice(...a),
        ...createSettingsSlice(...a),
        ...createFavouritesSlice(...a)
      }
      // persist rehydrates from localStorage synchronously when the store is
      // created, so a returning visitor's first client render would show
      // their saved plan while the prerendered HTML has the defaults (React
      // #418). zustand passes getServerState to useSyncExternalStore as the
      // server snapshot, which React uses while hydrating an island before
      // switching to the live state.
      Object.assign(a[2], { getServerState: () => initialState })
      return initialState
    },
    {
      name: "ntu-mods",
      version: 2,
      migrate: migrateBoundState
    }
  )
)

const selectAll = (state: StoreState) => state

/**
 * Main state in the app
 *
 * zustand's default selector (api.getState) ignores the snapshot it is handed,
 * so a bare `useBoundState()` would read the live state even mid-hydration;
 * defaulting to an identity selector keeps the server snapshot in effect.
 */
export const useBoundState = Object.assign(
  (<U = StoreState>(selector?: (state: StoreState) => U) =>
    useBoundStore(
      (selector ?? selectAll) as (state: StoreState) => U
    )) as typeof useBoundStore,
  useBoundStore
)
