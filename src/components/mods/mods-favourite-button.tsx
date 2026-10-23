"use client"

import { Heart } from "lucide-react"

import { track } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { useFavourites } from "@/hooks/use-favourites"

interface Props {
  moduleKey: string
  className?: string
}

const ModsFavouriteButton = ({ moduleKey, className }: Props) => {
  const { isFavourite, toggleFavourite } = useFavourites()
  const favourited = isFavourite(moduleKey)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavourite(moduleKey)
    track(favourited ? "module_unfavourited" : "module_favourited", {
      module_code: moduleKey
    })
  }

  return (
    <button
      onClick={handleClick}
      aria-label={favourited ? "Remove from favourites" : "Add to favourites"}
      title={favourited ? "Remove from favourites" : "Add to favourites"}
      className={cn(
        "text-muted-foreground hover:text-foreground flex h-full w-full items-center justify-center",
        className
      )}>
      <Heart
        className={cn(
          "size-4 transition-colors",
          favourited && "fill-rose-500 text-rose-500"
        )}
      />
    </button>
  )
}

export default ModsFavouriteButton
