"use client"

import { useBoundState } from "@/state/bound.state"

export const useFavourites = () => {
  const { favouriteModules, toggleFavourite, isFavourite } = useBoundState()
  return { favouriteModules, toggleFavourite, isFavourite }
}
