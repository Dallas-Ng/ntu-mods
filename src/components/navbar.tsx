"use client"

import { useEffect, useState } from "react"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { usePathname } from "@/hooks/use-pathname"

import ChangelogButton from "./changelog-button"
import NavActions from "./nav-actions"
import MainNav from "./nav/main-nav"
import MobileNav from "./nav/mobile-nav"
import SemesterStatus from "./nav/semester-status"

const Navbar = () => {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY
      if (scrollPos > 50) setScrolled(true)
      else setScrolled(false)
    }

    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-10 w-full [font-family:var(--font-inter-nav)]",
        scrolled && "shadow"
      )}>
      {/* The glass sits on an absolute child, not on the sticky header. Safari
          26 reads background-color and backdrop-filter from the sticky element
          itself for the toolbar tint, so a blur here would tint the status bar
          with whatever is scrolling behind it, scrim included. Absolute
          children are ignored. See .toolbar-edge in globals.css. */}
      <div aria-hidden="true" className="absolute inset-0 backdrop-blur-xl" />
      <div className="relative container flex h-16 items-center gap-2 px-2 lg:px-4">
        <div className="flex min-w-0 flex-1 items-center">
          <a href="/" className="flex shrink-0 items-center">
            <img
              src="/logo.webp"
              alt="Logo"
              width={30}
              height={30}
              className="size-7.5 object-contain"
            />

            <span
              className={cn(
                "hover:text-foreground ml-1 inline-block font-bold transition-colors sm:hidden lg:inline-block",
                pathname === "/" ? "text-foreground" : "text-muted-foreground"
              )}>
              {siteConfig.name}
            </span>
          </a>

          {/* One nav for all breakpoints: a single copy of the links in the
              HTML (crawlers otherwise read desktop + mobile twice). */}
          <MainNav />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
          <SemesterStatus />

          {/* One row, so the three icons are evenly spaced */}
          <div className="hidden items-center md:flex">
            <ChangelogButton />
            <NavActions />
          </div>

          <MobileNav />
        </div>
      </div>
    </header>
  )
}

export default Navbar
