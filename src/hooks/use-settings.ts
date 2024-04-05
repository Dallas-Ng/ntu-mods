import { useBoundState } from "@/state/bound.state"

export const useSettings = () => {
  const { settings, updateSettings, resetSettings } = useBoundState()
  const { isMobile = false, isBeta = false } = settings

  return { isMobile, isBeta, settings, updateSettings, resetSettings }
}
