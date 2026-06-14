import { StateCreator } from "zustand"

export interface FavouritesSlice {
  favouriteModules: string[]
  toggleFavourite: (moduleKey: string) => void
  isFavourite: (moduleKey: string) => boolean
}

export const createFavouritesSlice: StateCreator<FavouritesSlice> = (
  set,
  get
) => ({
  favouriteModules: [],
  toggleFavourite: (moduleKey) =>
    set((state) => ({
      favouriteModules: state.favouriteModules.includes(moduleKey)
        ? state.favouriteModules.filter((k) => k !== moduleKey)
        : [...state.favouriteModules, moduleKey]
    })),
  isFavourite: (moduleKey) => get().favouriteModules.includes(moduleKey)
})
