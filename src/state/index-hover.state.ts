import { create } from "zustand"

/** Index currently hovered in the desktop index picker, previewed on the timetable. */
export const useIndexHover = create<{
  hovered: { moduleKey: string; indexKey: string; currentKey?: string } | null
  setHovered: (
    hovered: { moduleKey: string; indexKey: string; currentKey?: string } | null
  ) => void
}>((set) => ({
  hovered: null,
  setHovered: (hovered) => set({ hovered })
}))
