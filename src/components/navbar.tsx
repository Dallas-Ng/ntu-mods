"use client"

import { useEffect, useState } from "react"
import { Bell, Menu, MessageSquare, Moon, Sun, X } from "lucide-react"

import { siteConfig } from "@/config/site"
import { track } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { useChangelogUnseenCount } from "@/hooks/use-changelog-unseen"
import { usePathname } from "@/hooks/use-pathname"
import { useTheme } from "@/hooks/use-theme"

import ChangelogButton from "./changelog-button"
import NavActions from "./nav-actions"
import MainNav from "./nav/main-nav"
import SemesterStatus from "./nav/semester-status"
import { NewBadge } from "./new-dot"
import { Button } from "./ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger
} from "./ui/drawer"

const Navbar = () => {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const changelogUnseen = useChangelogUnseenCount()
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
    <header className={cn("sticky top-0 z-10 w-full", scrolled && "shadow")}>
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
                "hover:text-foreground ml-1 hidden font-bold transition-colors lg:inline-block",
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

          {/* Mobile drawer */}
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <Button
                aria-label="Open navigation menu"
                size="icon"
                variant="ghost"
                className="md:hidden">
                <Menu className="size-4" />
              </Button>
            </DrawerTrigger>

            <DrawerContent
              aria-describedby={undefined}
              className="flex flex-col p-0">
              <DrawerTitle className="sr-only">Navigation menu</DrawerTitle>
              {/* Header */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
                <a href="/" className="flex items-center gap-2">
                  <img
                    src="/logo.webp"
                    alt="Logo"
                    width={24}
                    height={24}
                    className="size-6 object-contain"
                  />
                  <span className="font-bold">{siteConfig.name}</span>
                </a>
                <DrawerClose asChild>
                  <Button size="icon" variant="ghost" aria-label="Close menu">
                    <X className="size-4" />
                  </Button>
                </DrawerClose>
              </div>

              {/* Nav links */}
              <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
                <p className="text-muted-foreground mb-1 px-4 text-xs font-semibold tracking-widest uppercase">
                  Menu
                </p>
                {siteConfig.navLinks.map((link) => (
                  <DrawerClose key={link.route} asChild>
                    <a
                      href={link.route}
                      className={cn(
                        "hover:bg-accent flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                        pathname.includes(link.route)
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}>
                      {link.label}
                    </a>
                  </DrawerClose>
                ))}
              </nav>

              {/* Footer */}
              <div className="shrink-0 border-t p-3">
                <DrawerClose asChild>
                  <a
                    href="/changelog"
                    onClick={() =>
                      track("changelog_opened", {
                        source: "navbar_mobile_menu"
                      })
                    }
                    className="hover:bg-accent text-muted-foreground flex w-full items-center justify-between gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors">
                    <span className="flex items-center gap-3">
                      <Bell className="size-4" />
                      Changelog
                    </span>
                    {changelogUnseen > 0 && (
                      <NewBadge>
                        {changelogUnseen > 9 ? "9+" : changelogUnseen}
                      </NewBadge>
                    )}
                  </a>
                </DrawerClose>
                <DrawerClose asChild>
                  <a
                    href="/feedback"
                    className="hover:bg-accent text-muted-foreground flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors">
                    <MessageSquare className="size-4" />
                    Feedback
                  </a>
                </DrawerClose>
                <button
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="hover:bg-accent text-muted-foreground flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors">
                  {theme === "light" ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                  Theme
                </button>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
  )
}

export default Navbar
