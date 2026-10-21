import { StateCreator } from "zustand"

import {
  AppearanceSettings,
  DEFAULT_APPEARANCE_SETTINGS
} from "@/config/appearance-settings"

export const INIT_SETTINGS: Settings = {
  tableCell: {
    key: false,
    type: true,
    group: true,
    day: false,
    time: false,
    venue: true,
    remarks: true,
    duration: false
  },
  isMobile: false,
  appearance: DEFAULT_APPEARANCE_SETTINGS,
  modsViewMode: "cards",
  modsGroupBy: "none",
  standardisedScale: false,
  timetableLayout: "side",
  timetableToolbarOpen: true
}

export interface Settings {
  tableCell: {
    key: boolean
    type: boolean
    group: boolean
    day: boolean
    time: boolean
    venue: boolean
    remarks: boolean
    duration: boolean
  }
  isMobile: boolean
  appearance: AppearanceSettings
  modsViewMode: "cards" | "list"
  modsGroupBy: "none" | "level" | "au" | "faculty" | "type"
  /** Force every timeslot row to the same fixed height, so lesson length
   * vs. break length is visually proportional across the grid. */
  standardisedScale: boolean
  /** Timetable page: side panel on the right, or the panel below the grid. */
  timetableLayout: "side" | "below"
  /** The timetable toolbar starts open; this remembers if it was closed. */
  timetableToolbarOpen: boolean
}

export interface SettingsSlice {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  resetSettings: () => void
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  settings: INIT_SETTINGS,
  updateSettings: (newSettings: Partial<Settings>) =>
    set((state) => ({
      ...state,
      settings: { ...state.settings, ...newSettings }
    })),
  resetSettings: () => set((_state) => ({ settings: INIT_SETTINGS }))
})
