import { cva } from "class-variance-authority"

// Shared look for the side navs: "On this page" (ArticleToc) and the
// developer docs nav (DevNav). Astro and React both use these classes.

/** The small heading above a group of side nav links. */
export const sideNavLabel =
  "text-muted-foreground px-3 text-xs font-semibold tracking-wide uppercase"

/**
 * One side nav link. `highlight: "static"` draws the active pill on the link
 * itself; ArticleToc passes "sliding" because it draws one pill that glides
 * between links.
 */
export const sideNavItem = cva(
  "relative block rounded-lg px-3 py-1.5 text-sm leading-5 transition-colors duration-300",
  {
    variants: {
      active: {
        true: "text-foreground",
        false: "text-muted-foreground hover:text-foreground"
      },
      highlight: {
        static: "",
        sliding: ""
      }
    },
    compoundVariants: [
      {
        active: true,
        highlight: "static",
        class:
          "bg-muted before:bg-primary before:absolute before:top-1/2 before:left-0 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full"
      }
    ],
    defaultVariants: {
      active: false,
      highlight: "static"
    }
  }
)
