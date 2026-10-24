"use client"

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react"

import type { ArticleHeading } from "@/lib/server/articles"
import { cn } from "@/lib/utils"
import { cardVariants } from "@/components/ui/card"
import { sideNavItem, sideNavLabel } from "@/components/ui/side-nav"
import { SideNavDrawer } from "@/components/ui/side-nav-drawer"

// `group` is an optional label (e.g. a year) shown above the first heading in
// each run of headings that share it. `count` is an optional number shown
// beside the heading.
type TocHeading = ArticleHeading & { group?: string; count?: number }

interface Props {
  headings: TocHeading[]
  /** Also list depth-3 headings, indented under the depth-2 heading above. */
  nested?: boolean
  /** From which width the desktop nav shows; xl where a left nav takes room. */
  desktopFrom?: "lg" | "xl"
  /** See SideNavDrawer: false keeps the phone button in the page flow. */
  floating?: boolean
}

// Where a section lands after a jump: just below the navbar. The same line
// decides which section is active, so the one jumped to is highlighted.
const SCROLL_OFFSET = 128

/** Smooth-scrolls to a heading (instant with reduced motion) and sets the hash. */
const scrollToHeading = (id: string) => {
  const element = document.getElementById(id)
  if (!element) return

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  window.scrollTo({
    top:
      element.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET + 1,
    behavior: reduce ? "auto" : "smooth"
  })
  window.history.replaceState(null, "", `#${id}`)
}

// Tracks which heading is currently at the top of the viewport.
const useActiveHeading = (visibleHeadings: TocHeading[]) => {
  const [activeId, setActiveId] = useState(visibleHeadings[0]?.id || "")

  useEffect(() => {
    if (!visibleHeadings.length) return

    const elements = visibleHeadings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean) as HTMLElement[]

    if (!elements.length) return

    let animationFrame = 0

    const updateActiveHeading = () => {
      const current = elements.reduce((active, element) => {
        const top = element.getBoundingClientRect().top

        if (top <= SCROLL_OFFSET) return element
        return active
      }, elements[0])

      // A short last section never scrolls up to the offset, so at the very
      // bottom of the page it would stay unhighlighted.
      const pageHeight = document.documentElement.scrollHeight
      const atBottom =
        pageHeight > window.innerHeight + 4 &&
        window.innerHeight + window.scrollY >= pageHeight - 2

      setActiveId((atBottom ? elements[elements.length - 1] : current).id)
    }

    const handleScroll = () => {
      if (animationFrame) return

      animationFrame = window.requestAnimationFrame(() => {
        updateActiveHeading()
        animationFrame = 0
      })
    }

    updateActiveHeading()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }
    }
  }, [visibleHeadings])

  return activeId
}

const getVisibleHeadings = (headings: TocHeading[], nested?: boolean) =>
  headings.filter(
    (heading) => heading.depth === 2 || (nested && heading.depth === 3)
  )

/**
 * "On this page" for screens without the side nav: a square button under the
 * navbar opens a drawer from the right listing every section. It stays out of
 * the way until the reader has scrolled past the page title.
 */
export const MobileSectionDropdown = ({
  headings,
  nested,
  desktopFrom,
  floating = true
}: Props) => {
  const visibleHeadings = useMemo(
    () => getVisibleHeadings(headings, nested),
    [headings, nested]
  )
  const activeId = useActiveHeading(visibleHeadings)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400)

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (!visibleHeadings.length) return null

  const jumpTo = (event: React.MouseEvent, id: string) => {
    event.preventDefault()
    setOpen(false)

    // Wait for the drawer to release its scroll lock before scrolling.
    window.setTimeout(() => scrollToHeading(id), 250)
  }

  return (
    <SideNavDrawer
      side="right"
      title="On this page"
      hidden={floating && !scrolled}
      desktopFrom={desktopFrom}
      floating={floating}
      open={open}
      onOpenChange={setOpen}>
      <nav className="space-y-0.5">
        {visibleHeadings.map((heading, i) => {
          const showGroup =
            heading.group && heading.group !== visibleHeadings[i - 1]?.group

          return (
            <Fragment key={heading.id}>
              {showGroup && (
                <p
                  className={cn(
                    "text-muted-foreground px-3 pb-1 text-xs font-semibold",
                    i > 0 && "pt-3"
                  )}>
                  {heading.group}
                </p>
              )}
              <a
                href={`#${heading.id}`}
                onClick={(event) => jumpTo(event, heading.id)}
                aria-current={heading.id === activeId ? "true" : undefined}
                className={cn(
                  sideNavItem({ active: heading.id === activeId }),
                  "flex items-baseline justify-between gap-3 py-2.5",
                  heading.depth === 3 &&
                    "after:bg-muted-foreground/25 pl-7 after:absolute after:inset-y-0 after:left-4 after:w-px",
                  nested &&
                    heading.depth === 2 &&
                    "pt-4 pb-1 text-xs font-semibold tracking-wide uppercase"
                )}>
                <span>{heading.text}</span>
                {heading.count !== undefined && (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {heading.count}
                  </span>
                )}
              </a>
            </Fragment>
          )
        })}
      </nav>
    </SideNavDrawer>
  )
}

const ArticleToc = ({ headings, nested, desktopFrom = "lg" }: Props) => {
  const visibleHeadings = useMemo(
    () => getVisibleHeadings(headings, nested),
    [headings, nested]
  )
  const activeId = useActiveHeading(visibleHeadings)
  const navRef = useRef<HTMLElement>(null)
  // Position of the sliding highlight, measured from the active link so it
  // glides from one section to the next instead of jumping.
  const [indicator, setIndicator] = useState<{
    top: number
    height: number
  } | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const link = navRef.current?.querySelector<HTMLElement>(
        '[aria-current="true"]'
      )
      if (link) setIndicator({ top: link.offsetTop, height: link.offsetHeight })
    }

    measure()

    // Re-measure when the nav's own size changes (late font load, a heading
    // wrapping differently), not only on window resize.
    const observer = new ResizeObserver(measure)
    if (navRef.current) observer.observe(navRef.current)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [activeId, visibleHeadings])

  if (!visibleHeadings.length) return null

  return (
    <aside
      className={desktopFrom === "xl" ? "hidden xl:block" : "hidden lg:block"}>
      <div className="sticky top-24 space-y-2">
        <p className={sideNavLabel}>On this page</p>
        <nav
          ref={navRef}
          className="relative max-h-[calc(100vh-8rem)] space-y-0.5 overflow-y-auto text-sm">
          {indicator && (
            <span
              aria-hidden="true"
              className={cn(
                cardVariants(),
                "pointer-events-none absolute right-0 left-0 rounded-lg transition-[top,height] duration-300 ease-out motion-reduce:transition-none"
              )}
              style={{ top: indicator.top, height: indicator.height }}>
              <span className="bg-primary absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full" />
            </span>
          )}
          {visibleHeadings.map((heading, i) => {
            const isActive = heading.id === activeId
            const showGroup =
              heading.group && heading.group !== visibleHeadings[i - 1]?.group

            return (
              <Fragment key={heading.id}>
                {showGroup && (
                  <p
                    className={cn(
                      "text-muted-foreground px-3 pb-1 text-xs font-semibold",
                      i > 0 && "pt-3"
                    )}>
                    {heading.group}
                  </p>
                )}
                <a
                  href={`#${heading.id}`}
                  onClick={(event) => {
                    event.preventDefault()
                    scrollToHeading(heading.id)
                  }}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    sideNavItem({ active: isActive, highlight: "sliding" }),
                    heading.depth === 3 &&
                      "before:bg-muted-foreground/25 pl-6 text-xs before:absolute before:inset-y-0 before:left-3 before:w-px",
                    nested &&
                      heading.depth === 2 &&
                      "pt-2 pb-1 text-xs font-semibold tracking-wide uppercase",
                    nested && heading.depth === 2 && i > 0 && "mt-2"
                  )}>
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="line-clamp-2">{heading.text}</span>
                    {heading.count !== undefined && (
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {heading.count}
                      </span>
                    )}
                  </span>
                </a>
              </Fragment>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default ArticleToc
