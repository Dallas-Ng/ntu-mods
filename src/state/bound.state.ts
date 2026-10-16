import { create } from "zustand"
import { persist } from "zustand/middleware"

import { normalizeCustomCourses } from "@/lib/custom-course-migrate"

import { createFavouritesSlice, FavouritesSlice } from "./favourites.state"
import { createSettingsSlice, SettingsSlice } from "./settings.state"
import {
  createTimetableSlice,
  hasWorkspaceData,
  TimetableSlice
} from "./timetable.state"

interface StoreState extends TimetableSlice, SettingsSlice, FavouritesSlice {}

const LEGACY_BACKUP_KEY = "ntu-mods-pre-semester-backup"

/** Keep the pre-v3 saved state recoverable; never let a storage error block migrating. */
const backupLegacyStorage = () => {
  try {
    const raw = localStorage.getItem("ntu-mods")
    if (raw && !localStorage.getItem(LEGACY_BACKUP_KEY)) {
      localStorage.setItem(LEGACY_BACKUP_KEY, raw)
    }
  } catch {
    // storage unavailable or full: migrate anyway
  }
}

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

  // v3: plans are per semester. Existing data has no semester, so park it
  // behind the keep-or-clear dialog instead of guessing which one it was for.
  // It rewrites every user's saved data, hence the backup of the old shape.
  if (version < 3) {
    backupLegacyStorage()
    state.semester = null
    state.semesterWorkspaces = {}
    state.semesterChosenAgainst = null
    state.pendingSemesterAssignment = hasWorkspaceData(state)
  }

  return state
}

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
      version: 3,
      migrate: migrateBoundState,
      onRehydrateStorage: () => (state) => state?.reconcileSemester()
    }
  )
)
