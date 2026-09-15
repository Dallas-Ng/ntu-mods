import { describe, expect, it } from "vitest"
import { createStore } from "zustand/vanilla"

import {
  createSettingsSlice,
  INIT_SETTINGS,
  SettingsSlice
} from "./settings.state"

describe("settings slice", () => {
  it("starts with INIT_SETTINGS", () => {
    const store = createStore<SettingsSlice>(createSettingsSlice)
    expect(store.getState().settings).toEqual(INIT_SETTINGS)
  })

  it("updateSettings shallow-merges into the existing settings", () => {
    const store = createStore<SettingsSlice>(createSettingsSlice)
    store.getState().updateSettings({ modsViewMode: "list" })
    expect(store.getState().settings.modsViewMode).toBe("list")
    expect(store.getState().settings.modsGroupBy).toBe(
      INIT_SETTINGS.modsGroupBy
    )
  })

  it("resetSettings restores INIT_SETTINGS", () => {
    const store = createStore<SettingsSlice>(createSettingsSlice)
    store.getState().updateSettings({ modsViewMode: "list" })
    store.getState().resetSettings()
    expect(store.getState().settings).toEqual(INIT_SETTINGS)
  })
})
