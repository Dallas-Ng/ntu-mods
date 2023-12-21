import { useState } from "react"
import { useBoundState } from "@/state/bound-state"

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"

import { Button } from "../../ui/button"
import IndexCommand from "./index-command"

interface Props {
  courseKey: string
  filteredIndexes: CourseIndex
  handleSearch: (searchTerm: string) => void
  handleSelect: (idxKey: string) => void
}

export default function StarsIndexSheet(props: Props) {
  const { courseKey, handleSearch } = props
  const { coursesToIndex } = useBoundState()
  const [open, setOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    if (!open) handleSearch("")

    setOpen(open)
  }

  return (
    <Sheet onOpenChange={handleOpenChange} open={open}>
      <SheetTrigger>
        <Button variant="outline" className="w-full px-6 text-sm">
          {coursesToIndex[courseKey][0].key}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex h-screen w-[90vw] max-w-md flex-col px-2 py-4">
        <SheetHeader>
          <SheetTitle>Select Your Index</SheetTitle>
        </SheetHeader>

        <IndexCommand {...props} commandClassName="overflow-auto" />

        <div
          className="mt-auto flex h-[50px] w-full items-center justify-center rounded bg-slate-800"
          onClick={() => handleOpenChange(false)}>
          Close
        </div>
      </SheetContent>
    </Sheet>
  )
}
