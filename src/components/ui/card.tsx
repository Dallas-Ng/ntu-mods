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

/**
 * A white control sitting on a card or other grey surface. Its hover cannot
 * use the accent fill: that is the card's own hover colour, so the control
 * would vanish into the card. It stays white, its content turns black and a
 * shadow lifts it off the grey.
 */
export const controlOnCard =
  "bg-background hover:bg-background hover:text-foreground transition-[color,box-shadow] hover:shadow-md"
