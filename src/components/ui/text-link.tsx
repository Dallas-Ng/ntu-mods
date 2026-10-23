import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

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
      subtle: "hover:text-primary-alt"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

function TextLink({
  className,
  variant,
  ...props
}: React.ComponentProps<"a"> & VariantProps<typeof textLinkVariants>) {
  return (
    <a
      data-slot="text-link"
      className={cn(textLinkVariants({ variant }), className)}
      {...props}
    />
  )
}

export { TextLink, textLinkVariants }
