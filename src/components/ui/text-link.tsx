import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * The site's text link styles. Use `TextLink` for anchors; buttons that read
 * as links take `textLinkVariants()` directly.
 *
 * - default: a link inside running text
 * - muted: a link inside muted or coloured text; keeps the surrounding colour
 * - action: a standalone call to action under a section, like "See all"
 * - subtle: a list or nav entry that only changes colour on hover
 */
const textLinkVariants = cva("cursor-pointer transition-colors", {
  variants: {
    variant: {
      default:
        "text-primary hover:text-primary/80 underline underline-offset-2",
      muted: "hover:text-foreground underline underline-offset-2",
      action: "text-primary font-semibold underline-offset-4 hover:underline",
      subtle: "hover:text-primary"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

function TextLink({
  className,
  variant,
  arrow = false,
  children,
  ...props
}: React.ComponentProps<"a"> &
  VariantProps<typeof textLinkVariants> & {
    /** Ends the link with LinkArrow, for "go to" links like "See all". */
    arrow?: boolean
  }) {
  return (
    <a
      data-slot="text-link"
      className={cn(
        textLinkVariants({ variant }),
        arrow && "group inline-flex items-center gap-1",
        className
      )}
      {...props}>
      {children}
      {arrow && <LinkArrow />}
    </a>
  )
}

/**
 * The one "go to" arrow. It nudges right while its link (the nearest `group`)
 * is hovered. Use ChevronRight for rows in a list and ExternalLinkIcon for
 * links that leave the site; never a typed → or ›.
 */
function LinkArrow({
  className,
  ...props
}: React.ComponentProps<typeof ArrowRight>) {
  return (
    <ArrowRight
      aria-hidden
      className={cn(
        "size-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  )
}

/** The call to action at the foot of a link card: "Read the guide" and an arrow. */
function CardCta({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-primary inline-flex items-center gap-1 text-sm font-medium",
        className
      )}
      {...props}>
      {children}
      <LinkArrow />
    </span>
  )
}

/** The one icon marking a link that leaves the site (or opens elsewhere). */
function ExternalLinkIcon({
  className,
  ...props
}: React.ComponentProps<typeof ArrowUpRight>) {
  return (
    <ArrowUpRight
      aria-hidden
      className={cn("text-muted-foreground size-4 shrink-0", className)}
      {...props}
    />
  )
}

export { CardCta, ExternalLinkIcon, LinkArrow, TextLink, textLinkVariants }
