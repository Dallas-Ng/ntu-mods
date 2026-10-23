import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { cardVariants } from "@/components/ui/card"
import { NewBadge } from "@/components/new-dot"

// Phones show this many rows until "Show all" is pressed; desktop shows every row
const PHONE_ROWS = 4

export type Command = {
  name: string
  href: string
  desc: string
  art?: string
  /** Intrinsic [width, height] of `art`, so the image reserves its aspect ratio. */
  artSize?: [number, number]
  isNew?: boolean
}

// Giant command menu: typing filters, hover or arrow keys move the selection.
// Until the visitor takes over, the row at the middle of the screen is the
// selected one, so scrolling past the list cycles through the features.
// Rows are plain links, so it works without script and on touch.
const LandingCommands = ({ commands }: { commands: Command[] }) => {
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [manual, setManual] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)

  const q = query.trim().toLowerCase()
  const rows = q
    ? commands.filter((c) => `${c.name} ${c.desc}`.toLowerCase().includes(q))
    : commands
  // Searching always shows every match, so nothing is hidden from a search
  const collapsed = !showAll && !q && rows.length > PHONE_ROWS
  const selected = Math.min(active, Math.max(rows.length - 1, 0))
  const current = rows[selected]

  useEffect(() => {
    const list = listRef.current
    if (manual || q || !list || !("IntersectionObserver" in window)) return
    // A thin band across the middle of the viewport: the row inside it leads
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting)
            setActive(Number((e.target as HTMLElement).dataset.row))
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    )
    list.querySelectorAll("li[data-row]").forEach((li) => observer.observe(li))
    return () => observer.disconnect()
  }, [manual, q])

  const onKeyDown = (e: React.KeyboardEvent) => {
    setManual(true)
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive(Math.min(selected + 1, rows.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive(Math.max(selected - 1, 0))
    } else if (e.key === "Enter" && current) {
      window.location.href = current.href
    }
  }

  return (
    <section aria-labelledby="landing-features-heading">
      <h2 id="landing-features-heading" className="sr-only">
        Everything you need to plan your semester
      </h2>
      <input
        type="search"
        value={query}
        onFocus={() => setManual(true)}
        onChange={(e) => {
          setManual(true)
          setQuery(e.target.value)
          setActive(0)
        }}
        onKeyDown={onKeyDown}
        placeholder="Find a feature or tool"
        aria-label="Find a feature or tool"
        className={cn(
          cardVariants(),
          "placeholder:text-muted-foreground focus-visible:ring-primary h-14 w-full rounded-xl px-5 text-lg font-semibold tracking-tight outline-none focus-visible:ring-2 md:h-16 md:px-8 md:text-2xl"
        )}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[7fr_5fr]">
        <ul ref={listRef} className="space-y-1">
          {rows.map((c, i) => {
            const on = i === selected
            return (
              <li
                key={c.href + c.name}
                data-row={i}
                className={`landing-reveal ${
                  collapsed && i >= PHONE_ROWS ? "hidden lg:block" : ""
                }`}>
                <a
                  href={c.href}
                  // Real pointer movement only: scrolling under a resting
                  // mouse must not count as the visitor choosing a row
                  onMouseMove={(e) => {
                    if (e.movementX || e.movementY) {
                      setManual(true)
                      setActive(i)
                    }
                  }}
                  onPointerDown={() => setManual(true)}
                  onFocus={() => {
                    setManual(true)
                    setActive(i)
                  }}
                  className={`flex flex-col gap-4 rounded-xl p-4 transition-colors duration-150 md:px-6 md:py-5 lg:flex-row lg:items-center ${
                    on
                      ? "lg:bg-primary lg:text-primary-foreground"
                      : "lg:hover:bg-muted"
                  } max-lg:active:bg-muted`}>
                  {c.art && (
                    <span
                      className={cn(
                        cardVariants(),
                        "flex h-40 items-center justify-center rounded-lg p-4 sm:h-48 lg:hidden"
                      )}>
                      <img
                        src={c.art}
                        width={c.artSize?.[0]}
                        height={c.artSize?.[1]}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain"
                      />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-2xl leading-[1.1] font-bold tracking-tight md:text-3xl">
                      {c.name}
                      {c.isNew && (
                        <NewBadge size="lg" className="ml-3 align-middle" />
                      )}
                    </span>
                    <span className="mt-1 block max-w-xl text-sm md:text-base lg:hidden">
                      {c.desc}
                    </span>
                  </span>
                </a>
              </li>
            )
          })}
          {!rows.length && (
            <li className="px-5 py-8 text-lg md:px-6">
              Nothing matches &ldquo;{query}&rdquo;.
            </li>
          )}
        </ul>

        {rows.length > PHONE_ROWS && !q && (
          <button
            type="button"
            aria-expanded={showAll}
            onClick={() => setShowAll((v) => !v)}
            className={cn(
              cardVariants({ interactive: true }),
              "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold duration-150 lg:hidden"
            )}>
            {showAll ? "Show fewer" : `Show all ${rows.length} features`}
            <ChevronDown
              aria-hidden="true"
              className={`size-5 transition-transform duration-200 motion-reduce:transition-none ${
                showAll ? "rotate-180" : ""
              }`}
            />
          </button>
        )}

        <div
          aria-hidden="true"
          className={cn(
            cardVariants(),
            "sticky top-24 hidden h-[480px] self-start overflow-hidden rounded-2xl p-6 lg:block"
          )}>
          {commands.map((c) => (
            <div
              key={c.href + c.name}
              className={`absolute inset-6 flex flex-col justify-center gap-6 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
                current === c
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}>
              {c.art ? (
                <img
                  src={c.art}
                  width={c.artSize?.[0]}
                  height={c.artSize?.[1]}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="min-h-0 flex-1 object-contain"
                />
              ) : (
                <p className="text-3xl leading-tight font-bold tracking-tight">
                  {c.name}
                </p>
              )}
              <p className="text-sm md:text-base">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LandingCommands
