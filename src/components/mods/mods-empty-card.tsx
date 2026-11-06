"use client"

import { cn } from "@/lib/utils"
import { cardVariants } from "@/components/ui/card"

import { Button } from "../ui/button"

const ModsEmptyCard = ({
  searchTerm,
  onReset
}: {
  searchTerm?: string
  onReset: () => void
}) => {
  return (
    <div className={cn(cardVariants(), "w-full space-y-4 p-8 text-center")}>
      <div className="flex justify-center">
        <img
          src="/not-found.svg"
          alt=""
          width={300}
          height={200}
          className="pb-4"
        />
      </div>

      <div>
        <p className="text-sm">
          {searchTerm
            ? `No modules match "${searchTerm}"`
            : "No modules match your filters"}
        </p>
      </div>

      <div>
        <Button variant="secondary" onClick={onReset}>
          Reset filters
        </Button>
      </div>
    </div>
  )
}

export default ModsEmptyCard
