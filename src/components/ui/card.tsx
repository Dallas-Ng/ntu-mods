import { cva } from "class-variance-authority"

/**
 * The site's card surface: a grey fill, no border (borders are for tables,
 * form controls and floating layers). Callers add radius and padding.
 * `interactive` is for cards that are links or buttons.
 */
export const cardVariants = cva("bg-muted", {
  variants: {
    interactive: {
      true: "hover:bg-accent focus-visible:ring-ring/50 transition-colors outline-none focus-visible:ring-[3px]",
      false: ""
    }
  },
  defaultVariants: {
    interactive: false
  }
})
