"use client"

import { useRef, useState } from "react"
import { ChevronsUpDownIcon } from "lucide-react"
import posthog from "posthog-js"

import { TRUN_DAY_MAP } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

import { Button } from "../ui/button"

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const

function parseDays(value: string): number[] {
  if (value === "all") return [...ALL_DAYS]
  return value
    .split(",")
    .map(Number)
    .filter((d) => d >= 1 && d <= 7)
}

function encodeDays(days: number[]): string {
  if (days.length === ALL_DAYS.length) return "all"
  return days.slice().sort((a, b) => a - b).join(",")
}

interface Props {
  paramsValue: string
  disabled?: boolean
}

export const ModsDaySelect = ({ paramsValue, disabled }: Props) => {
  const { value, setValue } = useModsSearchParams(paramsValue, "moduleDay")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDays = parseDays(value)
  const isAll = selectedDays.length === ALL_DAYS.length

  const label = isAll
    ? "Any Day"
    : selectedDays
        .map((d) => TRUN_DAY_MAP[d as keyof typeof TRUN_DAY_MAP])
        .join(", ")

  const toggleDay = (day: number) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day]
    const encoded = next.length === 0 ? "all" : encodeDays(next)
    setValue(encoded)
    posthog.capture("mods_filter_applied", {
      filter_type: "module_day",
      value: encoded
    })
  }

  return (
    <div ref={containerRef} className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={disabled}
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between overflow-hidden",
              !isAll && "ring-ring rounded-md ring-1"
            )}>
            <span className="min-w-0 flex-1 truncate text-left">{label}</span>
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="p-2"
          container={containerRef.current}
          style={{
            width: containerRef.current?.clientWidth
              ? containerRef.current.clientWidth
              : "auto"
          }}>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              {ALL_DAYS.map((day) => {
                const active = selectedDays.includes(day)
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "h-7 min-w-0 flex-1 cursor-pointer rounded border text-xs font-medium transition-[color,background-color,border-color]",
                      active
                        ? "bg-foreground text-background border-transparent"
                        : "text-muted-foreground hover:border-foreground"
                    )}>
                    {TRUN_DAY_MAP[day as keyof typeof TRUN_DAY_MAP]}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => {
                setValue("all")
                posthog.capture("mods_filter_cleared", {
                  filter_type: "module_day"
                })
              }}
              className="text-muted-foreground hover:text-foreground mt-1 cursor-pointer text-left text-xs transition-colors">
              Reset
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
