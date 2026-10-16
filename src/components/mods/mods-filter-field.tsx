"use client"

import { cn } from "@/lib/utils"

export const ModsFilterField = ({
  label,
  hint,
  className,
  children
}: {
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}) => (
  <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
    {children}
  </div>
)

interface ChipProps {
  active: boolean
  onClick: () => void
  className?: string
  children: React.ReactNode
}

export const ModsChip = ({
  active,
  onClick,
  className,
  children
}: ChipProps) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      "focus-visible:ring-ring/50 h-8 min-w-9 cursor-pointer rounded-md border px-3 text-sm font-medium transition-[color,background-color,border-color] outline-none focus-visible:ring-[3px]",
      active
        ? "bg-foreground text-background border-transparent"
        : "text-muted-foreground hover:border-foreground hover:text-foreground",
      className
    )}>
    {children}
  </button>
)
