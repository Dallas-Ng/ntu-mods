import { useBoundState } from "@/state/bound.state"
import { useHydrated } from "@/hooks/use-hydrated"
import type { Settings } from "@/state/settings.state"

export const useSettings = () => {
  const { settings, updateSettings, resetSettings } = useBoundState()
  const hydrated = useHydrated()
  const {
    isMobile = false,
    isBeta = false,
    modsViewMode = "cards",
    modsGroupBy = "none"
  } = hydrated ? settings : ({} as Settings)

  return { isMobile, isBeta, modsViewMode, modsGroupBy, settings, updateSettings, resetSettings }
}
