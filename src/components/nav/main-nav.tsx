"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { NavigationMenu } from "radix-ui"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { usePathname } from "@/hooks/use-pathname"
import { NewDot } from "@/components/new-dot"

import MegaMenu from "./mega-menu"
import { NAV_MENUS } from "./menus"
import { isActive, NEW_DOTS } from "./nav-shared"

const MORE = "more"
// The 16px page gutter a menu keeps from the window edge.
const EDGE = 16
const MD = "(min-width: 768px)"

const links = siteConfig.navLinks

/**
 * How many nav items fit before the rest move under "More". Overflow items keep
 * their intrinsic width so measurements stay current across breakpoints.
 */
function usePriorityNav(moreEnabled: boolean) {
  const rootRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const moreRef = useRef<HTMLLIElement>(null)
  const [visible, setVisible] = useState<number>(links.length)
  const [measured, setMeasured] = useState(false)

  const compute = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const widths = itemRefs.current.map(
      (el) => el?.getBoundingClientRect().width ?? 0
    )
    const available = root.getBoundingClientRect().width
    const total = widths.reduce((sum, w) => sum + w, 0)
    let count: number = links.length
    if (total > available) {
      let used = moreEnabled
        ? (moreRef.current?.getBoundingClientRect().width ?? 0)
        : 0
      count = 0
      for (const w of widths) {
        if (used + w > available) break
        used += w
        count++
      }
    }
    setVisible(count)
    setMeasured(true)
  }, [moreEnabled])

  useLayoutEffect(() => {
    let active = true
    const observer = new ResizeObserver(compute)
    // Reveal the row after measuring with the final font metrics.
    void document.fonts.ready.then(() => {
      if (!active) return
      compute()
      if (rootRef.current) observer.observe(rootRef.current)
      itemRefs.current.forEach((el) => el && observer.observe(el))
    })
    return () => {
      active = false
      observer.disconnect()
    }
  }, [compute])

  return { rootRef, itemRefs, moreRef, visible, measured }
}

/**
 * The top-level links. As many fit as the width allows, in order; from md up
 * the rest go under "More", below md the menu drawer lists them. Dropdowns open
 * below their trigger and are kept inside the window.
 */
const MainNav = () => {
  const pathname = usePathname()
  const [moreEnabled, setMoreEnabled] = useState(true)
  const { rootRef, itemRefs, moreRef, visible, measured } =
    usePriorityNav(moreEnabled)
  const [value, setValue] = useState("")
  const [offset, setOffset] = useState<{ x: number; animate: boolean }>({
    x: 0,
    animate: false
  })
  const triggerRefs = useRef<Record<string, HTMLElement | null>>({})

  useLayoutEffect(() => {
    const mq = window.matchMedia(MD)
    const update = () => setMoreEnabled(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const viewportRef = useRef<HTMLDivElement>(null)
  const switching = useRef(false)

  const onValueChange = (next: string) => {
    switching.current = value !== "" && next !== ""
    setValue(next)
  }

  // Menus size to their content, so the panel is measured once it renders and
  // then placed under its trigger, kept inside the window.
  useLayoutEffect(() => {
    if (!value) return
    let frame = 0
    const place = (tries: number) => {
      const root = rootRef.current
      const trigger = triggerRefs.current[value]
      const content = viewportRef.current?.querySelector<HTMLElement>(
        ':scope > :not([data-motion^="to-"])'
      )
      if (!root || !trigger) return
      if (!content) {
        if (tries > 0) frame = requestAnimationFrame(() => place(tries - 1))
        return
      }
      const rootLeft = root.getBoundingClientRect().left
      const triggerLeft = trigger.getBoundingClientRect().left - rootLeft
      const width = content.getBoundingClientRect().width
      const max = document.documentElement.clientWidth - EDGE - rootLeft - width
      const min = EDGE - rootLeft
      setOffset({
        x: Math.max(min, Math.min(triggerLeft, max)),
        animate: switching.current
      })
    }
    place(5)
    return () => cancelAnimationFrame(frame)
  }, [value, rootRef])

  const overflow = links.slice(visible)
  const showMore = moreEnabled && overflow.length > 0

  return (
    <NavigationMenu.Root
      ref={rootRef}
      aria-label="Main"
      value={value}
      onValueChange={onValueChange}
      delayDuration={100}
      className="relative ml-1 hidden min-w-0 flex-1 sm:block">
      <NavigationMenu.List
        className={cn(
          "flex items-center",
          !measured && "overflow-hidden [@media(scripting:enabled)]:invisible"
        )}>
        {links.map((link, i) => {
          const menu = NAV_MENUS[link.route]
          const active = isActive(pathname, link.route)
          const itemClass = cn(
            "hover:text-foreground relative flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors lg:px-3",
            active ? "text-foreground" : "text-muted-foreground"
          )
          const dot = NEW_DOTS[link.route] && (
            <NewDot
              storageKey={NEW_DOTS[link.route]}
              triggerRoute={link.route}
              className="absolute top-0.5 right-0.5 hidden h-2 w-2 md:flex"
            />
          )

          return (
            <NavigationMenu.Item
              key={link.route}
              value={link.route}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              className={cn(
                "shrink-0",
                i >= visible && "invisible absolute top-0 left-0 w-max"
              )}>
              {menu ? (
                <>
                  {/* The label is a link to the section; hovering opens the
                      menu. The chevron opens it without leaving the page, for
                      touch screens with no hover, and Down arrow does the same
                      from the keyboard. */}
                  <NavigationMenu.Trigger asChild>
                    <a
                      href={link.route}
                      ref={(el) => {
                        triggerRefs.current[link.route] = el
                      }}
                      aria-current={active ? "page" : undefined}
                      onClick={(e) => {
                        if (
                          (e.target as Element).closest("[data-menu-toggle]")
                        ) {
                          e.preventDefault()
                          onValueChange(value === link.route ? "" : link.route)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown" && value !== link.route) {
                          e.preventDefault()
                          onValueChange(link.route)
                        }
                      }}
                      className={cn(itemClass, "group")}>
                      {link.label}
                      <span
                        data-menu-toggle
                        className="-m-1.5 flex p-1.5"
                        aria-hidden>
                        <ChevronDown className="size-3 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
                      </span>
                      {dot}
                    </a>
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content className="data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out w-max">
                    <MegaMenu menu={menu} name={link.label} />
                  </NavigationMenu.Content>
                </>
              ) : (
                <NavigationMenu.Link asChild active={active}>
                  <a href={link.route} className={itemClass}>
                    {link.label}
                    {dot}
                  </a>
                </NavigationMenu.Link>
              )}
            </NavigationMenu.Item>
          )
        })}

        <NavigationMenu.Item
          value={MORE}
          ref={moreRef}
          // Kept in the layout while hidden from view, so its width is known
          // before it is needed.
          className={cn(
            "shrink-0",
            !moreEnabled && "hidden",
            moreEnabled && !showMore && "invisible absolute"
          )}
          aria-hidden={!showMore || undefined}>
          <NavigationMenu.Trigger
            ref={(el) => {
              triggerRefs.current[MORE] = el
            }}
            tabIndex={showMore ? undefined : -1}
            className="group text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors lg:px-3">
            More
            <ChevronDown
              aria-hidden
              className="size-3 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out w-max">
            <ul className="w-max min-w-48 p-2">
              {overflow.map((link) => (
                <li key={link.route}>
                  <NavigationMenu.Link asChild>
                    <a
                      href={link.route}
                      className={cn(
                        "hover:bg-accent flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive(pathname, link.route)
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}>
                      {link.label}
                    </a>
                  </NavigationMenu.Link>
                </li>
              ))}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <div
        className={cn(
          "absolute top-full left-0 isolate z-50",
          offset.animate &&
            "transition-transform duration-200 ease-(--ease-out-strong) motion-reduce:transition-none"
        )}
        style={{ transform: `translateX(${offset.x}px)` }}>
        <NavigationMenu.Viewport
          ref={viewportRef}
          className="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-top-1 data-[state=closed]:slide-out-to-top-1 data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 relative mt-3 h-(--radix-navigation-menu-viewport-height) w-(--radix-navigation-menu-viewport-width) origin-top-left overflow-hidden rounded-2xl border shadow-lg data-[state=closed]:[animation-duration:100ms] data-[state=open]:[animation-duration:150ms] motion-reduce:animate-none"
        />
      </div>
    </NavigationMenu.Root>
  )
}

export default MainNav
