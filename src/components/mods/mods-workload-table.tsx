import { Fragment } from "react"

import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { getModuleWorkload } from "@/lib/get-module-workload"
import { cn } from "@/lib/utils"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../ui/tooltip"

const ModsWorkloadTable = ({ moduleKey }: { moduleKey: string }) => {
  const { moduleWorkload, totalHours } = getModuleWorkload(moduleKey)

  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">
        Total hours per week: {totalHours} hrs
      </div>

      <div className="flex flex-wrap gap-[0.25rem] text-sm">
        {Object.entries(moduleWorkload)
          .filter(([_, v]) => v) // remove empty workload
          .map(([key, value], idx) => {
            const indexStyle = getIndexTypeStyle(key.toUpperCase())

            return (
              <Fragment key={idx}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex gap-[0.25rem] text-xs">
                        {Array.from({ length: value }).map((_, idx) => (
                          <div
                            key={idx}
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
