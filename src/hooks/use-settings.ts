import { useBoundState } from "@/state/bound.state"
import type { Settings } from "@/state/settings.state"

import { useHydrated } from "@/hooks/use-hydrated"

export const useSettings = () => {
  const { settings, updateSettings, resetSettings } = useBoundState()
  const hydrated = useHydrated()
  const {
    isMobile = false,
    modsViewMode = "cards",
    modsGroupBy = "none"
  } = hydrated ? settings : ({} as Partial<Settings>)

  return {
    isMobile,
    modsViewMode,
    modsGroupBy,
    settings,
    updateSettings,
    resetSettings
  }
}
