"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import posthog from "posthog-js"

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

const TimetablePlanSwitcher = () => {
  const { timetables, timetableIndex, updateTimetableIndex } = useTimetable()
  const { isMobile } = useSettings()

  const [isContainerOpen, setIsContainerOpen] = useState(false)

  const handleClick = (index: number) => {
    posthog.capture("timetable_plan_switched", {
      from_plan: timetableIndex + 1,
      to_plan: index + 1
    })
    updateTimetableIndex(index)
  }

  const trigger = (
    <Button variant="outline">
      Plan {timetableIndex + 1}
      <ChevronDown
        className={cn(
          "ml-1 size-4 transition-transform",
          isContainerOpen && "-rotate-180"
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
            "hover:bg-accent cursor-pointer py-3 transition-all lg:py-1.5",
            index === timetableIndex && "bg-muted"
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
          <span className="text-muted-foreground w-full text-center text-sm">
            Select a plan to switch
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

export default TimetablePlanSwitcher
