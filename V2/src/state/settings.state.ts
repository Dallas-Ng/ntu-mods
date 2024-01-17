import { StateCreator } from "zustand"

const INIT_SETTINGS: Settings = {
  tableCell: {
    key: false,
    type: true,
    group: true,
    day: false,
    time: true,
    venue: true,
    remarks: true,
    duration: false
  },
  isMobile: false
}

interface Settings {
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
