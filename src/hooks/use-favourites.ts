"use client"

import { useBoundState } from "@/state/bound.state"

export const useFavourites = () => {
  const { favouriteModules, toggleFavourite } = useBoundState()
  // Derived from the rendered snapshot rather than the store's get()-based
  // isFavourite, which reads localStorage-backed state during hydration.
  const isFavourite = (moduleKey: string) =>
    favouriteModules.includes(moduleKey)
  return { favouriteModules, toggleFavourite, isFavourite }
}
