import { useBoundState } from "@/state/bound.state"
import { INIT_SETTINGS } from "@/state/settings.state"

import { useHydrated } from "@/hooks/use-hydrated"

export const useSettings = () => {
  const { settings, updateSettings, resetSettings } = useBoundState()
  const hydrated = useHydrated()
  const effectiveSettings = hydrated ? settings : INIT_SETTINGS

  return {
    isMobile: effectiveSettings.isMobile,
    modsViewMode: effectiveSettings.modsViewMode,
    modsGroupBy: effectiveSettings.modsGroupBy,
    settings: effectiveSettings,
    updateSettings,
    resetSettings
  }
}
