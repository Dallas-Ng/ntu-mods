"use client"

import { useState } from "react"
import { ChevronsUpDown, TrashIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTimetable } from "@/hooks/use-timetable"

import { Skeleton } from "../ui/skeleton"
import TimetableIndexModifier from "./timetable-index-modifier"
import TimetableModulesSelect from "./timetable-modules-select"

const TimetableModifier = () => {
  const { timetable, removeItemFromTimetable } = useTimetable()
  const [activeKey, setActiveKey] = useState<string | null>(null)

  return (
    <div className="relative space-y-4">
      <div className="relative z-[2] h-[40px] w-full rounded-lg">
        <div className="absolute left-0 top-0 w-full">
          <TimetableModulesSelect />
        </div>
      </div>

      <div className="relative max-h-[50vh] min-h-10 w-full overflow-y-auto rounded-lg border">
        <div className="p-2 text-center text-xs text-secondary">
          Registered Modules
        </div>
        <hr />

        {Object.entries(timetable).map(([moduleKey, indexKey]) => (
          <TimetableIndexModifier
            key={moduleKey}
            moduleKey={moduleKey}
            onOpenChange={(moduleKey) => setActiveKey(moduleKey)}>
            <div
              className={cn(
                "cursor-pointer px-4 py-2.5 text-sm transition-colors hover:bg-accent",
                activeKey === moduleKey && "bg-accent"
              )}>
              <div className="flex w-full justify-between">
                <div className="flex gap-1">
                  <div className="w-[60px]">{moduleKey}</div>
                  <div className="text-sm text-secondary">{indexKey}</div>
                </div>

                <div>
                  <TrashIcon
                    className="size-4 text-secondary hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeItemFromTimetable(moduleKey)
                    }}
                  />
                </div>
              </div>
            </div>
          </TimetableIndexModifier>
        ))}

        {Object.entries(timetable).length === 0 && (
          <>
            <div className="p-2">
              <div className="text-center text-sm text-secondary">
                You have not added modules
                <br /> Click on the search bar above to add modules
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export const TimetableModifierLoader = () => (
  <div className="space-y-4">
    <Skeleton className="h-[40px]" />

    <div className="relative max-h-[50vh] min-h-10 w-full overflow-y-auto rounded-lg border">
      <div className="p-2 text-center text-xs text-secondary">
        Registered Modules
      </div>

      <hr />

      <div className="p-2">
        <div className="text-center text-sm text-secondary">
          You have not added modules
          <br /> Click on the search bar above to add modules
        </div>
      </div>
    </div>
  </div>
)

export default TimetableModifier
