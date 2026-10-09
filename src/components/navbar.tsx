"use client"

import { useEffect, useState } from "react"
import { Megaphone, Menu, Moon, Settings, Sun, X } from "lucide-react"
import posthog from "posthog-js"

import { siteConfig } from "@/config/site"
import { LATEST_SEMESTER_LABEL_SHORT } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useChangelogUnseenCount } from "@/hooks/use-changelog-unseen"
import { usePathname } from "@/hooks/use-pathname"
import { useTheme } from "@/hooks/use-theme"

import ChangelogButton from "./changelog-button"
import NavActions from "./nav-actions"
import { NewDot } from "./new-dot"
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
    <header
      className={cn(
        "sticky top-0 z-10 w-full backdrop-blur-xl",
        scrolled && "shadow"
      )}>
      <div className="container flex h-16 items-center gap-2 px-2 lg:px-4">
        <div className="flex min-w-0 items-center">
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
                "hover:text-foreground ml-1 hidden font-bold transition-colors md:inline-block",
                pathname === "/" ? "text-foreground" : "text-muted-foreground"
              )}>
              {siteConfig.name}
            </span>
          </a>

          {/* One nav for all breakpoints: a single copy of the links in the
              HTML (crawlers otherwise read desktop + mobile twice). Items
              past the 2nd collapse at narrow widths; all show from md up. */}
          <nav
            aria-label="Main"
            className="ml-2 flex items-center gap-1 md:gap-0">
            {siteConfig.navLinks.map((link, i) => (
              <a
                href={link.route}
                key={link.route}
                className={cn(
                  "hover:bg-accent hover:text-foreground relative rounded-md px-2 py-1.5 text-sm font-semibold transition-colors md:mr-1 md:px-3 md:hover:bg-transparent",
                  i === 2 && "hidden min-[420px]:flex",
                  i === 3 && "hidden min-[520px]:flex",
                  i === 4 && "hidden min-[640px]:flex",
                  i === 5 && "hidden min-[700px]:flex",
                  pathname.includes(link.route)
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}>
                {link.label}
                {link.route === "/tools" && (
                  <NewDot
                    storageKey="seen-tools"
                    triggerRoute="/tools"
                    className="absolute top-0 right-0 hidden h-2 w-2 md:flex"
                  />
                )}
                {link.route === "/exams" && (
                  <NewDot
                    storageKey="seen-exams"
                    triggerRoute="/exams"
                    className="absolute top-0 right-0 hidden h-2 w-2 md:flex"
                  />
                )}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          <a href="/faq#current-semester" className="hover:underline">
            <span className="text-sm whitespace-nowrap">
              {LATEST_SEMESTER_LABEL_SHORT}
            </span>
          </a>

          <div className="hidden md:block">
            <ChangelogButton />
          </div>

          <div className="hidden md:block">
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
                <Menu className="size-5" />
              </Button>
            </DrawerTrigger>

            <DrawerContent
              aria-describedby={undefined}
              className="flex flex-col p-0">
              <DrawerTitle className="sr-only">Navigation menu</DrawerTitle>
              {/* Header */}
              <div className="flex items-center justify-between border-b px-5 py-4">
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
                  <Button size="icon" variant="ghost">
                    <X className="size-4" />
                  </Button>
                </DrawerClose>
              </div>

              {/* Nav links */}
              <nav className="flex flex-col p-3">
                <p className="text-muted-foreground/60 mb-1 px-4 text-[11px] font-semibold tracking-widest uppercase">
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
              <div className="mt-auto border-t p-3">
                <DrawerClose asChild>
                  <a
                    href="/changelog"
                    onClick={() =>
                      posthog.capture("changelog_opened", {
                        source: "navbar_mobile_menu"
                      })
                    }
                    className="hover:bg-accent text-muted-foreground flex w-full items-center justify-between gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors">
                    <span className="flex items-center gap-3">
                      <Megaphone className="size-4" />
                      Changelog
                    </span>
                    {changelogUnseen > 0 && (
                      <span className="rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-semibold text-black">
                        {changelogUnseen > 9 ? "9+" : changelogUnseen}
                      </span>
                    )}
                  </a>
                </DrawerClose>
                <DrawerClose asChild>
                  <button
                    onClick={() => window.location.assign("/settings")}
                    className="hover:bg-accent text-muted-foreground flex w-full cursor-pointer items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors">
                    <Settings className="size-4" />
                    Settings
                  </button>
                </DrawerClose>
                <button
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="hover:bg-accent text-muted-foreground flex w-full cursor-pointer items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors">
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
