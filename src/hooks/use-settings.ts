import { useBoundState } from "@/state/bound.state"

export const useSettings = () => {
  const settings = useBoundState((s) => s.settings)
  const updateSettings = useBoundState((s) => s.updateSettings)
  const resetSettings = useBoundState((s) => s.resetSettings)

  return {
    isMobile: settings.isMobile,
    modsViewMode: settings.modsViewMode,
    modsGroupBy: settings.modsGroupBy,
    settings,
    updateSettings,
    resetSettings
  }
}
