"use client"

import { useEffect, useRef, useState } from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

import { cn, delay } from "../lib/utils"
import { Button } from "./ui/button"

interface Props {
  value: string
  emptyText?: string
  selectItems: { value: string; label: string | React.ReactNode }[]
  closeOnSelect?: boolean
  onChange?: (value: string | null) => void
  divClassName?: string
  disabled?: boolean
}
const CustomSelect = (props: Props) => {
  const {
    value,
    emptyText,
    selectItems,
    closeOnSelect = false,
    onChange,
    divClassName,
    disabled
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const [activeItem, setActiveItem] = useState<string | null>(value)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const activeItemLabel = selectItems.find((item) => item.value === activeItem)

  useEffect(() => {
    onChange && onChange(activeItem)
  }, [activeItem])

  useEffect(() => {
    setActiveItem(value)
  }, [value])

  const handleClose = async () => {
    await delay(100)
    setPopoverOpen(false)
  }

  const handleSelect = (value: string) => {
    setActiveItem(value)
    if (closeOnSelect) handleClose()
  }

  return (
    <div ref={containerRef} className={cn("w-full", divClassName)}>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={disabled}
            variant="outline"
            role="combobox"
            aria-label={
              typeof activeItemLabel?.label === "string"
                ? activeItemLabel.label
                : undefined
            }
            className={cn(
              "w-full justify-between overflow-hidden",
              divClassName
            )}>
            <div className="min-w-0 flex-1 overflow-hidden text-left">
              {activeItemLabel?.label}
            </div>
            <ChevronsUpDownIcon
              aria-hidden="true"
              className="ml-2 size-4 shrink-0 opacity-50"
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="p-0"
          container={containerRef.current}
          style={{
            width: containerRef.current?.clientWidth
              ? containerRef.current.clientWidth
              : "auto"
          }}>
          <Command>
            <CommandEmpty>{emptyText ?? "No items found."} </CommandEmpty>

            <CommandGroup
              className="max-h-96 overflow-y-auto"
              style={{ scrollbarGutter: "stable" }}>
              {selectItems.map((item) => (
                <CommandItem
                  key={item.value}
                  className="hover:bg-accent cursor-pointer"
                  onSelect={() => handleSelect(item.value)}>
                  <div className="flex items-center gap-2">
                    <CheckIcon
                      className={cn(
                        "ml-auto size-4",
                        activeItem === item.value ? "opacity-100" : "opacity-0"
                      )}
                    />

                    <div className="truncate">{item.label}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default CustomSelect
