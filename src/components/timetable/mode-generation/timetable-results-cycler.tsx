"use client"

import { ChevronLeftIcon, ChevronRightIcon, SaveIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface Props {
  combinations: GeneratedCombination[]
  currentIndex: number
  onNavigate: (index: number) => void
  onSaveToPlan: (planIndex: number) => void
  truncated?: boolean
}

const TimetableResultsCycler = ({
  combinations,
  currentIndex,
  onNavigate,
  onSaveToPlan,
  truncated
}: Props) => {
  if (combinations.length === 0) return null

  const current = combinations[currentIndex]

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          {combinations.length} option{combinations.length !== 1 ? "s" : ""} found
          {truncated && " (more exist — try relaxing constraints)"}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
              <SaveIcon className="size-3" />
              Save
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[0, 1, 2, 3, 4].map((i) => (
              <DropdownMenuItem key={i} onClick={() => onSaveToPlan(i)}>
                Save to Plan {i + 1}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-muted-foreground flex gap-3 text-xs">
        <span>{current.freeDays} free day{current.freeDays !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span>{current.daysWithClass} day{current.daysWithClass !== 1 ? "s" : ""} with class</span>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={currentIndex === 0}
          onClick={() => onNavigate(currentIndex - 1)}
          aria-label="Previous combination">
          <ChevronLeftIcon className="size-3" />
        </Button>

        <span className="text-muted-foreground text-xs">
          {currentIndex + 1} / {combinations.length}
        </span>

        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={currentIndex === combinations.length - 1}
          onClick={() => onNavigate(currentIndex + 1)}
          aria-label="Next combination">
          <ChevronRightIcon className="size-3" />
        </Button>
      </div>
    </div>
  )
}

export default TimetableResultsCycler
