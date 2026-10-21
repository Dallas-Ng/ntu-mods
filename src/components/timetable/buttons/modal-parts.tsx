"use client"

import { cn } from "@/lib/utils"

// The few pieces every toolbar modal and drawer is built from, so Share,
// Import, Calendar and the rest read as one family.

/** A labelled block: a title, a muted hint, then the control. */
export const ModalSection = ({
  title,
  hint,
  className,
  children
}: {
  title: string
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
}) => (
  <section className={cn("space-y-2.5", className)}>
    <div className="space-y-0.5">
      <h3 className="text-sm font-medium">{title}</h3>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
    {children}
  </section>
)

/** A switch row: what it does on the left, the switch on the right. */
export const ModalOption = ({
  title,
  hint,
  children
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
    <div className="space-y-0.5">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
    {children}
  </div>
)

/** Buttons at the bottom: stacked on phones with the main action first. */
export const ModalFooter = ({
  className,
  children
}: {
  className?: string
  children: React.ReactNode
}) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end",
      className
    )}>
    {children}
  </div>
)

/** A short message under a control, in the modal's own style. */
export const ModalNote = ({
  tone = "muted",
  children
}: {
  tone?: "muted" | "danger"
  children: React.ReactNode
}) => (
  <p
    className={cn(
      "rounded-lg px-3 py-2 text-xs",
      tone === "danger"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground"
    )}>
    {children}
  </p>
)
