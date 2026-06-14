import { Fragment } from "react"

import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { cn } from "@/lib/utils"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../ui/tooltip"

interface Props {
  indexes: Record<string, Index[]>
}

function computeWorkload(indexes: Record<string, Index[]>) {
  // Pick first available index group
  const firstKey = Object.keys(indexes)[0]
  const slots = firstKey ? indexes[firstKey] : []

  const sum = (type: string) =>
    slots
      .filter((s) => s.type.includes(type))
      .reduce((acc, s) => acc + s.duration, 0) / 2

  return {
    moduleWorkload: {
      lec: sum("LEC"),
      des: sum("DES"),
      lab: sum("LAB"),
      prj: sum("PRJ"),
      sem: sum("SEM"),
      tut: sum("TUT")
    },
    totalHours: slots.reduce((acc, s) => acc + s.duration, 0) / 2
  }
}

const ModsWorkloadTable = ({ indexes }: Props) => {
  const { moduleWorkload, totalHours } = computeWorkload(indexes)

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-[0.25rem] text-sm">
        {Object.entries(moduleWorkload)
          .filter(([_, v]) => v)
          .map(([key, value], idx) => {
            const indexStyle = getIndexTypeStyle(key.toUpperCase())

            return (
              <Fragment key={idx}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex gap-[0.25rem] text-xs">
                        {Array.from({ length: value }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              indexStyle.background,
                              "rounded-sm px-2 py-1"
                            )}>
                            {key.toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </TooltipTrigger>

                    <TooltipContent>
                      {value} hrs of {key.toUpperCase()} each week
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Fragment>
            )
          })}
      </div>
    </div>
  )
}

export default ModsWorkloadTable
