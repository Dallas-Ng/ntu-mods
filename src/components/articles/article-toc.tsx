"use client"

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { ChevronUp } from "lucide-react"

import type { ArticleHeading } from "@/lib/server/articles"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"

// `group` is an optional label (e.g. a year) shown above the first heading in
// each run of headings that share it. `count` is an optional number shown
// beside the heading.
type TocHeading = ArticleHeading & { group?: string; count?: number }

interface Props {
  headings: TocHeading[]
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
      const offset = 128
      const current = elements.reduce((active, element) => {
        const top = element.getBoundingClientRect().top

        if (top <= offset) return element
        return active
      }, elements[0])

      // A short last section never scrolls up to the offset, so at the very
      // bottom of the page it would stay unhighlighted.
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 2

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

const getVisibleHeadings = (headings: TocHeading[]) =>
  headings.filter((heading) => heading.depth === 2)

// Matches the offset used to decide which section is active, so a section
// lands just below the navbar and the sticky bar.
const MOBILE_SCROLL_OFFSET = 128

/**
 * Slim sticky bar for screens without the side nav. It shows the section being
 * read; tapping it opens a bottom drawer listing every section, so long
 * headings get a full-width row each instead of being squeezed into chips.
 */
export const MobileSectionDropdown = ({ headings }: Props) => {
  const visibleHeadings = useMemo(
    () => getVisibleHeadings(headings),
    [headings]
  )
  const activeId = useActiveHeading(visibleHeadings)
  const [open, setOpen] = useState(false)

  if (!visibleHeadings.length) return null

  const active =
    visibleHeadings.find((heading) => heading.id === activeId) ??
    visibleHeadings[0]

  const jumpTo = (event: React.MouseEvent, id: string) => {
    event.preventDefault()
    setOpen(false)

    // Wait for the drawer to release its scroll lock before scrolling.
    window.setTimeout(() => {
      const element = document.getElementById(id)
      if (!element) return

      window.scrollTo({
        top:
          element.getBoundingClientRect().top +
          window.scrollY -
          MOBILE_SCROLL_OFFSET +
          1,
        behavior: "smooth"
      })
      window.history.replaceState(null, "", `#${id}`)
    }, 250)
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <div className="bg-background not-prose sticky top-16 z-[5] -mx-3 border-b lg:hidden">
        <DrawerTrigger asChild>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left">
            <span className="min-w-0">
              <span className="text-muted-foreground block text-xs">
                On this page
              </span>
              <span className="block truncate text-sm font-medium">
                {active.text}
              </span>
            </span>
            <ChevronUp
              aria-hidden="true"
              className="text-muted-foreground size-4 shrink-0"
            />
          </button>
        </DrawerTrigger>
      </div>

      <DrawerContent>
        <DrawerTitle className="px-4 pt-3 pb-2 text-base">
          On this page
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          Jump to a section of this page
        </DrawerDescription>

        <nav className="overflow-y-auto px-2 pb-6">
          {visibleHeadings.map((heading, i) => {
            const showGroup =
              heading.group && heading.group !== visibleHeadings[i - 1]?.group

            return (
              <Fragment key={heading.id}>
                {showGroup && (
                  <p
                    className={cn(
                      "text-muted-foreground/70 px-3 pb-1 text-xs font-semibold",
                      i > 0 ? "pt-3" : "pt-1"
                    )}>
                    {heading.group}
                  </p>
                )}
                <a
                  href={`#${heading.id}`}
                  onClick={(event) => jumpTo(event, heading.id)}
                  aria-current={heading.id === activeId ? "true" : undefined}
                  className={cn(
                    "text-muted-foreground active:bg-muted flex items-baseline justify-between gap-3 rounded-lg px-3 py-3 text-sm leading-5",
                    heading.id === activeId &&
                      "bg-muted text-foreground font-medium"
                  )}>
                  <span>{heading.text}</span>
                  {heading.count !== undefined && (
                    <span className="text-muted-foreground/70 text-xs tabular-nums">
                      {heading.count}
                    </span>
                  )}
                </a>
              </Fragment>
            )
          })}
        </nav>
      </DrawerContent>
    </Drawer>
  )
}

const ArticleToc = ({ headings }: Props) => {
  const visibleHeadings = useMemo(
    () => getVisibleHeadings(headings),
    [headings]
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
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [activeId, visibleHeadings])

  if (!visibleHeadings.length) return null

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-2">
        <p className="text-muted-foreground px-3 text-xs font-semibold tracking-wide uppercase">
          On this page
        </p>
        <nav
          ref={navRef}
          className="relative max-h-[calc(100vh-8rem)] space-y-0.5 overflow-y-auto text-sm">
          {indicator && (
            <span
              aria-hidden="true"
              className="bg-muted pointer-events-none absolute right-0 left-0 rounded-lg transition-[top,height] duration-300 ease-out motion-reduce:transition-none"
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
                      "text-muted-foreground/70 px-3 pb-1 text-xs font-semibold",
                      i > 0 && "pt-3"
                    )}>
                    {heading.group}
                  </p>
                )}
                <a
                  href={`#${heading.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "text-muted-foreground hover:text-foreground relative block rounded-lg px-3 py-1.5 leading-5 transition-colors duration-300",
                    isActive && "text-foreground"
                  )}>
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="line-clamp-2">{heading.text}</span>
                    {heading.count !== undefined && (
                      <span className="text-muted-foreground/70 text-xs tabular-nums">
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
