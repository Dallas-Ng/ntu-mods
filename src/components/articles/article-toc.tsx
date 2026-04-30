"use client"

import { useEffect, useMemo, useState } from "react"

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
      <div className="sticky top-24 space-y-3">
        <p className="text-sm font-semibold text-foreground">On this page</p>
        <nav className="max-h-[calc(100vh-8rem)] space-y-1 overflow-y-auto border-l pr-1 text-sm">
          {visibleHeadings.map((heading) => {
            const isActive = heading.id === activeId

            return (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "block border-l-2 border-transparent py-1.5 pl-3 pr-2 leading-5 text-foreground/65 transition-colors hover:border-primary/50 hover:text-foreground",
                  isActive && "border-l-primary bg-primary/5 text-foreground"
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
