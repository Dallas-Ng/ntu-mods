"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import type { ArticleHeading } from "@/lib/server/articles"
import { cn } from "@/lib/utils"

interface Props {
  headings: ArticleHeading[]
}

const ArticleToc = ({ headings }: Props) => {
  const visibleHeadings = useMemo(
    () => headings.filter((heading) => heading.depth === 2),
    [headings]
  )
  const [activeId, setActiveId] = useState(visibleHeadings[0]?.id || "")
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

      setActiveId(current.id)
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
          {visibleHeadings.map((heading) => {
            const isActive = heading.id === activeId

            return (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "text-muted-foreground hover:text-foreground relative block rounded-lg px-3 py-1.5 leading-5 transition-colors duration-300",
                  isActive && "text-foreground"
                )}>
                <span className="line-clamp-2">{heading.text}</span>
              </a>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default ArticleToc
