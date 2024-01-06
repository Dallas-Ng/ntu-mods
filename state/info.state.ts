import { StateCreator } from "zustand"

interface Info {
  mobile: boolean
}

export interface InfoSlice {
  info: Info
  updateInfo: (info: Partial<Info>) => void
}

export const createInfoSlice: StateCreator<InfoSlice> = (set) => ({
  info: { mobile: false },
  updateInfo: (info: Partial<Info>) =>
    set((state) => ({ ...state, info: { ...state.info, ...info } }))
})
