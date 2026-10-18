import {
  createFavouritesSlice,
  FavouritesSlice
} from "@/state/favourites.state"
import { describe, expect, it } from "vitest"
import { createStore } from "zustand/vanilla"

describe("favourites slice", () => {
  it("starts with no favourites", () => {
    const store = createStore<FavouritesSlice>(createFavouritesSlice)
    expect(store.getState().favouriteModules).toEqual([])
  })

  it("toggling adds then removes a module", () => {
    const store = createStore<FavouritesSlice>(createFavouritesSlice)
    store.getState().toggleFavourite("CZ2001")
    expect(store.getState().favouriteModules).toEqual(["CZ2001"])

    store.getState().toggleFavourite("CZ2001")
    expect(store.getState().favouriteModules).toEqual([])
  })
})
