"use client"

import { useRef, useState } from "react"
import { ChevronDown, Pencil } from "lucide-react"

import { track } from "@/lib/analytics"
import { MAX_PLAN_NAME } from "@/lib/plan-name"
import { cn } from "@/lib/utils"
import { useHydrated } from "@/hooks/use-hydrated"
import { usePlanNames } from "@/hooks/use-plan-names"
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
import { Input } from "@/components/ui/input"
import { ModalFooter } from "@/components/ui/modal-parts"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

const RenameDialog = ({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const { timetableIndex } = useTimetable()
  const { names, setPlanName } = usePlanNames()
  const [value, setValue] = useState("")

  // Start from the current name each time it opens.
  const handleOpenChange = (next: boolean) => {
    if (next) setValue(names?.[timetableIndex] ?? "")
    onOpenChange(next)
  }

  const save = (name: string) => {
    setPlanName(timetableIndex, name.trim().slice(0, MAX_PLAN_NAME))
    track("timetable_plan_renamed", { plan: timetableIndex + 1 })
    onOpenChange(false)
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      nested={false}
      title="Name this plan"
      showDescription
      description={`Plan ${timetableIndex + 1} keeps its number, so you can always tell which one it is.`}
      className="sm:max-w-sm">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          save(value)
        }}>
        <div className="space-y-1.5">
          <Input
            autoFocus
            value={value}
            maxLength={MAX_PLAN_NAME}
            placeholder={`Plan ${timetableIndex + 1}`}
            onChange={(e) => setValue(e.target.value)}
          />
          <p className="text-muted-foreground text-right text-xs tabular-nums">
            {value.length}/{MAX_PLAN_NAME}
          </p>
        </div>
        <ModalFooter className="sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => save("")}>
            Use default name
          </Button>
          <Button type="submit">Save</Button>
        </ModalFooter>
      </form>
    </ResponsiveModal>
  )
}

const TimetablePlanSwitcher = () => {
  const { timetables, timetableIndex, updateTimetableIndex } = useTimetable()
  const { label, named } = usePlanNames()
  const { isMobile } = useSettings()
  const hydrated = useHydrated()

  const [isContainerOpen, setIsContainerOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  // The hint follows the pointer only: not focus, and not a click. After a
  // click it stays away until the pointer has left the button.
  const [tipOpen, setTipOpen] = useState(false)
  const tipTimer = useRef<number>(0)
  const clicked = useRef(false)
  const showTip = () => {
    if (clicked.current) return
    window.clearTimeout(tipTimer.current)
    tipTimer.current = window.setTimeout(() => setTipOpen(true), 300)
  }
  const hideTip = () => {
    window.clearTimeout(tipTimer.current)
    setTipOpen(false)
  }

  const handleClick = (index: number) => {
    track("timetable_plan_switched", {
      from_plan: timetableIndex + 1,
      to_plan: index + 1
    })
    updateTimetableIndex(index)
    setIsContainerOpen(false)
  }

  const trigger = (
    <Button variant="ghost" className="h-8 max-w-[45vw] px-3 sm:max-w-48">
      <span className="truncate">{label(timetableIndex)}</span>
      <ChevronDown
        className={cn(
          "ml-1 size-4 shrink-0 transition-transform",
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
            "hover:bg-accent cursor-pointer justify-between py-3 transition-all lg:py-1.5",
            index === timetableIndex && "bg-muted"
          )}>
          <span className="truncate">{label(index)}</span>
          {named(index) && (
            <span className="text-muted-foreground shrink-0 text-xs">
              Plan {index + 1}
            </span>
          )}
        </CommandItem>
      ))}
      <CommandItem
        onSelect={() => {
          setIsContainerOpen(false)
          // Let the menu finish closing first: a dialog opened in the same
          // tick is dismissed by the menu handing focus back to its trigger.
          window.setTimeout(() => setRenameOpen(true), 150)
        }}
        className="text-muted-foreground hover:text-foreground mt-1 cursor-pointer gap-2 rounded-none border-t py-3 lg:py-1.5">
        <Pencil className="size-4" />
        Rename this plan
      </CommandItem>
    </Command>
  )

  const rename = <RenameDialog open={renameOpen} onOpenChange={setRenameOpen} />

  // Saved plans and their names load after hydration: hold the button's
  // place so it does not flash the default name first.
  if (!hydrated) return <Skeleton className="h-8 w-32 sm:w-40" />

  if (isMobile) {
    return (
      <>
        <Drawer open={isContainerOpen} onOpenChange={setIsContainerOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>

          <DrawerContent className="p-2">
            <span className="text-muted-foreground w-full text-center text-sm">
              Select a plan to switch
            </span>

            {items}
          </DrawerContent>
        </Drawer>
        {rename}
      </>
    )
  }

  return (
    <>
      <DropdownMenu open={isContainerOpen} onOpenChange={setIsContainerOpen}>
        <TooltipProvider delayDuration={300}>
          <Tooltip open={tipOpen && !isContainerOpen}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger
                asChild
                onPointerEnter={showTip}
                onPointerLeave={() => {
                  clicked.current = false
                  hideTip()
                }}
                onPointerDown={() => {
                  clicked.current = true
                  hideTip()
                }}>
                {trigger}
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-52 text-center">
              <p className="font-medium">Plans</p>
              <p className="text-xs opacity-80">
                Keep up to five versions of your timetable and switch between
                them.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="start" className="min-w-52">
          {items}
        </DropdownMenuContent>
      </DropdownMenu>
      {rename}
    </>
  )
}

export default TimetablePlanSwitcher
