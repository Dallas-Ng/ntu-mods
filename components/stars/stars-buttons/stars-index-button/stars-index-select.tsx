import { useRef, useState } from "react"
import { useBoundState } from "@/state/bound-state"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

import IndexCommand from "./index-command"

interface Props {
  courseKey: string
  filteredIndexes: CourseIndex
  handleSearch: (searchTerm: string) => void
  handleSelect: (idxKey: string) => void
}

export default function StarsIndexSelect(props: Props) {
  const { courseKey, handleSearch } = props
  const { coursesToIndex } = useBoundState()
  const containerRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    if (!open) handleSearch("")

    setOpen(open)
  }

  return (
    <div ref={containerRef}>
      <Popover onOpenChange={handleOpenChange} open={open}>
        <PopoverTrigger>
          <Button
            variant="outline"
            className="w-full px-6 text-sm"
            onClick={() => setOpen(true)}>
            {coursesToIndex[courseKey][0].key}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          sideOffset={4}
          className="p-0 md:w-96"
          container={containerRef.current}>
          <IndexCommand
            {...props}
            commandClassName="max-h-[450px] overflow-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
