import { useBoundState } from "@/state/bound.state"

export const useSettings = () => {
  const { settings, updateSettings, resetSettings } = useBoundState()
  const { isMobile } = settings

  return { isMobile, settings, updateSettings, resetSettings }
}
