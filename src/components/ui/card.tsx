import { cva } from "class-variance-authority"

/**
 * The site's card surface: a grey fill with a border. The border is what
 * separates it from the page; a pale fill alone barely shows in light mode.
 * Callers add radius and padding. `interactive` is for cards that are links
 * or buttons.
 */
export const cardVariants = cva("bg-muted border", {
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
