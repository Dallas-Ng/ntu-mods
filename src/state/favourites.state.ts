import { StateCreator } from "zustand"

export interface FavouritesSlice {
  favouriteModules: string[]
  toggleFavourite: (moduleKey: string) => void
}

export const createFavouritesSlice: StateCreator<FavouritesSlice> = (set) => ({
  favouriteModules: [],
  toggleFavourite: (moduleKey) =>
    set((state) => ({
      favouriteModules: state.favouriteModules.includes(moduleKey)
        ? state.favouriteModules.filter((k) => k !== moduleKey)
        : [...state.favouriteModules, moduleKey]
    }))
})
