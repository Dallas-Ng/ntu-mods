"use client"

import { useBoundState } from "@/state/bound.state"
import { ChevronsUpDown, TrashIcon } from "lucide-react"

import { useTimetable } from "@/hooks/use-timetable"

import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"
import TimetableModulesSelect from "./timetable-modules-select"

const TimetableModifier = () => {
  // const { timetable, removeItemFromTimetable } = useTimetable()
  const { timetableIndex, timetables, removeItemFromTimetable } =
    useBoundState()

  const timetable = timetables[timetableIndex]

  return (
    <div className="w-full rounded-lg border p-4">
      <TimetableModulesSelect />

      <div className="mt-5">
        {Object.entries(timetable).map(([moduleKey, indexKey]) => {
          return (
            <div
              key={moduleKey}
              className="cursor-pointer rounded p-2 text-sm transition-colors hover:bg-accent">
              <div className="flex justify-between">
                <div>
                  {moduleKey} | {indexKey}
                </div>

                <div>
                  <TrashIcon
                    className="h-4 w-4 text-secondary hover:text-foreground"
                    onClick={() => removeItemFromTimetable(moduleKey)}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const TimetableModifierLoader = () => (
  <div className="w-full rounded-lg border p-4">
    <Button variant="outline" className="w-full" disabled>
      Click to Add Mods
      <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
    </Button>

    <div className="mt-5 space-y-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  </div>
)

export default TimetableModifier
