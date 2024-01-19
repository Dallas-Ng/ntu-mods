"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"
import { Button } from "@/components/ui/button"
import { Command, CommandItem } from "@/components/ui/command"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

const TimetablePlanSwitcher = () => {
  const { timetables, timetableIndex, updateTimetableIndex } = useTimetable()
  const { isMobile } = useSettings()

  const [isContainerOpen, setIsContainerOpen] = useState(false)

  const handleClick = (index: number) => {
    updateTimetableIndex(index)
  }

  const trigger = (
    <Button variant="outline">
      Plan {timetableIndex + 1}
      <ChevronDown
        className={cn(
          "ml-1 size-4 transition-transform",
          isContainerOpen && "rotate-180"
        )}
      />
    </Button>
  )

  const items = (
    <Command shouldFilter={false}>
      {timetables.map((_, index) => (
        <CommandItem
          key={index}
          onSelect={() => handleClick(index)}
          className={cn(
            "cursor-pointer py-3 transition-all hover:bg-muted md:py-1.5",
            index === timetableIndex && "bg-accent text-accent-foreground "
          )}>
          Plan {index + 1}
        </CommandItem>
      ))}
    </Command>
  )

  if (isMobile) {
    return (
      <Drawer onOpenChange={(val) => setIsContainerOpen(val)}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>

        <DrawerContent className="p-2">
          <span className="w-full text-center text-sm text-muted-foreground">
            Select a plan to view
          </span>

          {items}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <DropdownMenu onOpenChange={(val) => setIsContainerOpen(val)}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent>{items}</DropdownMenuContent>
    </DropdownMenu>
  )
}

export const TimetablePlanSwitcherLoading = () => (
  <div className="h-[36px] w-[93px] rounded-md border p-2">
    <Skeleton className="size-full" />
  </div>
)

export default TimetablePlanSwitcher
