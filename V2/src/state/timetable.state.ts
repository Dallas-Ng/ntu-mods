import { StateCreator } from "zustand"

export interface TimetableSlice {
  timetables: Timetable[]
  timetableIndex: number
  addTimetable: (timetable: Timetable) => void
  updateTimetable: (timetable: Timetable, timetableIndex: number) => void
  addItemToTimetable: (moduleKey: string, indexKey: string) => void
  removeItemFromTimetable: (moduleKey: string) => void
  updateTimetableIndex: (timetableIndex: number) => void
}

export const createTimetableSlice: StateCreator<TimetableSlice> = (set) => ({
  timetables: [{}, {}, {}, {}, {}],
  timetableIndex: 0,
  addTimetable: (timetable: Timetable) =>
    set((state) => ({
      timetables: [...state.timetables, timetable]
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
  updateTimetableIndex: (timetableIndex: number) => {
    set((_state) => ({ timetableIndex }))
  },
  resetTimetables: () => {
    set((_state) => ({ timetables: [], timetableIndex: 0 }))
  }
})
