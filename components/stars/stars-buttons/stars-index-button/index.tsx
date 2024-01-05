"use client"

import { useBoundState } from "@/state/bound-state"

import { Button } from "@/components/ui/button"
import SheetPopover from "@/components/sheet-popover"

import IndexCommand from "./index-command"
import useIndexLogic from "./index-logic"

interface Props {
  courseKey: string
}

export default function StarsIndexButton({ courseKey }: Props) {
  const { coursesToIndex } = useBoundState()
  const indexProps = useIndexLogic({ courseKey })
  const { handleSearch } = indexProps

  return (
    <>
      <SheetPopover
        openChange={(open) => (open ? handleSearch("") : {})}
        triggerComponent={
          <Button variant="outline" className="w-full px-6 text-sm">
            {coursesToIndex[courseKey][0].key}
          </Button>
        }
        popoverContent={
          <IndexCommand
            {...indexProps}
            commandClassName="max-h-[450px] overflow-auto"
          />
        }
        sheetContent={
          <IndexCommand {...indexProps} commandClassName="overflow-auto" />
        }
      />
    </>
  )
}
