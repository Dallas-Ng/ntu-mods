import { StateCreator } from "zustand"

import {
  AppearanceSettings,
  DEFAULT_APPEARANCE_SETTINGS
} from "@/config/appearance-settings"

const INIT_SETTINGS: Settings = {
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
  modsGroupBy: "none"
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
