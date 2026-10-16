"use client"

import { cn } from "@/lib/utils"

interface Option {
  value: string
  label: string
}

/** One-tap segmented control, shared by the planner and /mods so a semester always looks the same. */
const SemesterPills = ({
  options,
  value,
  onChange,
  ariaLabel = "Semester",
  className
}: {
  options: Option[]
  value: string
  onChange: (value: string) => void
  ariaLabel?: string
  className?: string
}) => (
  <div
    role="group"
    aria-label={ariaLabel}
    className={cn("bg-muted inline-flex rounded-md p-0.5", className)}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={option.value === value}
        onClick={() => option.value !== value && onChange(option.value)}
        className={cn(
          "h-8 cursor-pointer rounded-[5px] px-3 text-xs font-medium whitespace-nowrap transition-colors",
          option.value === value
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        )}>
        {option.label}
      </button>
    ))}
  </div>
)

export default SemesterPills
