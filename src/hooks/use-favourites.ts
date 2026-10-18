"use client"

import { useBoundState } from "@/state/bound.state"

export const useFavourites = () => {
  const favouriteModules = useBoundState((s) => s.favouriteModules)
  const toggleFavourite = useBoundState((s) => s.toggleFavourite)
  const isFavourite = (moduleKey: string) =>
    favouriteModules.includes(moduleKey)
  return { favouriteModules, toggleFavourite, isFavourite }
}
