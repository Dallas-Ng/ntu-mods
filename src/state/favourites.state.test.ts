import { describe, expect, it } from "vitest"
import { createStore } from "zustand/vanilla"

import { createFavouritesSlice, FavouritesSlice } from "./favourites.state"

describe("favourites slice", () => {
  it("starts with no favourites", () => {
    const store = createStore<FavouritesSlice>(createFavouritesSlice)
    expect(store.getState().favouriteModules).toEqual([])
    expect(store.getState().isFavourite("CZ2001")).toBe(false)
  })

  it("toggling adds then removes a module", () => {
    const store = createStore<FavouritesSlice>(createFavouritesSlice)
    store.getState().toggleFavourite("CZ2001")
    expect(store.getState().isFavourite("CZ2001")).toBe(true)

    store.getState().toggleFavourite("CZ2001")
    expect(store.getState().isFavourite("CZ2001")).toBe(false)
  })
})
