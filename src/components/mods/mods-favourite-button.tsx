"use client"

import { Heart } from "lucide-react"
import posthog from "posthog-js"

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
    posthog.capture(favourited ? "module_unfavourited" : "module_favourited", {
      module_code: moduleKey
    })
  }

  return (
    <button
      onClick={handleClick}
      aria-label={favourited ? "Remove from favourites" : "Add to favourites"}
      title={favourited ? "Remove from favourites" : "Add to favourites"}
      className={cn(
        "hover:bg-accent flex h-full w-full cursor-pointer items-center justify-center transition-colors",
        className
      )}>
      <Heart
        className={cn(
          "size-3.5 transition-colors",
          favourited ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
        )}
      />
    </button>
  )
}

export default ModsFavouriteButton
