"use client"

import { cn } from "@/lib/utils"
import { cardVariants } from "@/components/ui/card"

import { Button } from "../ui/button"

const ModsEmptyCard = () => {
  return (
    <div className={cn(cardVariants(), "w-full space-y-4 p-8 text-center")}>
      <div className="flex justify-center">
        <img
          src="/not-found.svg"
          alt="theres no search results, try changing your filters..."
          width={300}
          height={200}
          className="pb-4"
        />
      </div>

      <div>
        <p className="text-sm">No modules found, try changing your filters</p>
      </div>

      <div>
        <Button
          variant="secondary"
          onClick={() => window.location.assign("/mods")}>
          Click here to reset filters
        </Button>
      </div>
    </div>
  )
}

export default ModsEmptyCard
