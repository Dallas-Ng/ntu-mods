import { StateCreator } from "zustand"

import { DEFAULT_GENERATION_CONFIG } from "@/lib/generation-config"

export interface TimetableSlice {
  timetables: Timetable[]
  timetableIndex: number
  timetableCreationMode: TimetableCreationMode
  generationConfig: GenerationConfig
  hasOnboarded: boolean
  migrateTimetable: (timetable: Timetable) => void
  updateTimetable: (timetable: Timetable, timetableIndex: number) => void
  addItemToTimetable: (moduleKey: string, indexKey: string) => void
  updateItemIndex: (moduleKey: string, indexKey: string) => void
  removeItemFromTimetable: (moduleKey: string) => void
  updateTimetableIndex: (timetableIndex: number) => void
  duplicateTimetable: (fromIndex: number, toIndex: number) => void
  resetTimetables: () => void
  setTimetableCreationMode: (mode: TimetableCreationMode) => void
  updateGenerationConfig: (config: Partial<GenerationConfig>) => void
  setHasOnboarded: (value: boolean) => void
}

export const createTimetableSlice: StateCreator<TimetableSlice> = (set) => ({
  timetables: [{}, {}, {}, {}, {}],
  timetableIndex: 0,
  timetableCreationMode: "default",
  generationConfig: DEFAULT_GENERATION_CONFIG,
  hasOnboarded: false,
  migrateTimetable: (timetable: Timetable) =>
    set((state) => ({
      timetables: [{ ...timetable }, {}, {}, {}, {}]
    })),
  updateTimetable: (timetable: Timetable, timetableIndex: number) => {
    set((state) => {
      const updatedTimetables = [...state.timetables]
      const updatedTimetable = { ...timetable }

      updatedTimetables[timetableIndex] = updatedTimetable

      return { ...state, timetables: updatedTimetables }
    })
  },
  addItemToTimetable: (moduleKey: string, indexKey: string) => {
    set((state) => {
      const currentTimetable = state.timetables[state.timetableIndex]
      const updatedTimetable = {
        ...currentTimetable,
        [moduleKey]: indexKey
      }

      // Check if there are changes; if not, return the current state
      if (currentTimetable === updatedTimetable) {
        return state
      }

      const updatedTimetables = [...state.timetables]
      updatedTimetables[state.timetableIndex] = updatedTimetable

      return { ...state, timetables: updatedTimetables }
    })
  },
  removeItemFromTimetable: (moduleKey: string) => {
    set((state) => {
      const updatedTimetables = [...state.timetables] // Create a shallow copy of timetables
      const updatedTimetable = { ...updatedTimetables[state.timetableIndex] } // Create a shallow copy of the specific timetable

      delete updatedTimetable[moduleKey]

      updatedTimetables[state.timetableIndex] = updatedTimetable

      return { ...state, timetables: updatedTimetables }
    })
  },
  updateItemIndex: (moduleKey: string, indexKey: string) => {
    set((state) => {
      const updatedTimetables = [...state.timetables]
      const updatedTimetable = { ...updatedTimetables[state.timetableIndex] }

      updatedTimetable[moduleKey] = indexKey

      updatedTimetables[state.timetableIndex] = updatedTimetable

      return { ...state, timetables: updatedTimetables }
    })
  },
  updateTimetableIndex: (timetableIndex: number) => {
    set((_state) => ({ timetableIndex }))
  },
  duplicateTimetable: (fromIndex, toIndex) =>
    set((state) => {
      const updated = [...state.timetables]
      updated[toIndex] = { ...state.timetables[fromIndex] }
      return { timetables: updated, timetableIndex: toIndex }
    }),
  resetTimetables: () => {
    set((_state) => ({ timetables: [{}, {}, {}, {}, {}], timetableIndex: 0 }))
  },
  setTimetableCreationMode: (mode: TimetableCreationMode) => {
    set((_state) => ({ timetableCreationMode: mode }))
  },
  updateGenerationConfig: (config: Partial<GenerationConfig>) => {
    set((state) => ({
      generationConfig: { ...state.generationConfig, ...config }
    }))
  },
  setHasOnboarded: (value: boolean) => {
    set((_state) => ({ hasOnboarded: value }))
  }
})
