import { useBoundState } from "@/state/bound.state"

export const useSettings = () => {
  const { settings, updateSettings, resetSettings } = useBoundState()
  const {
    isMobile = false,
    isBeta = false,
    modsViewMode = "cards",
    modsGroupBy = "none"
  } = settings

  return { isMobile, isBeta, modsViewMode, modsGroupBy, settings, updateSettings, resetSettings }
}
