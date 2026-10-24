"use client"

import { useEffect, useState } from "react"
import {
  ArrowRight,
  Bell,
  ChevronDown,
  Menu,
  MessageSquare,
  Moon,
  Sun,
  X
} from "lucide-react"
import { NavigationMenu } from "radix-ui"

import { siteConfig } from "@/config/site"
import { track } from "@/lib/analytics"
import { LATEST_SEMESTER_LABEL_SHORT } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useChangelogUnseenCount } from "@/hooks/use-changelog-unseen"
import { usePathname } from "@/hooks/use-pathname"
import { useTheme } from "@/hooks/use-theme"

import ChangelogButton from "./changelog-button"
import NavActions from "./nav-actions"
import { NewBadge, NewDot } from "./new-dot"
import { Button } from "./ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger
} from "./ui/drawer"
import { TextLink } from "./ui/text-link"

const NEW_DOTS: Record<string, string> = {
  "/tools": "seen-tools",
  "/maps": "seen-maps",
  "/exams": "seen-exams"
}

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
                "hover:text-foreground ml-1 hidden font-bold transition-colors min-[890px]:inline-block",
                pathname === "/" ? "text-foreground" : "text-muted-foreground"
              )}>
              {siteConfig.name}
            </span>
          </a>

          {/* One nav for all breakpoints: a single copy of the links in the
              HTML (crawlers otherwise read desktop + mobile twice). Items
              past the 2nd collapse at narrow widths; all show from md up. */}
          <NavigationMenu.Root
            aria-label="Main"
            delayDuration={0}
            className="relative ml-2">
            <NavigationMenu.List className="flex items-center gap-1 min-[890px]:gap-0">
              {siteConfig.navLinks.map((link, i) => {
                const itemClass = cn(
                  "hover:bg-accent hover:text-foreground relative flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold transition-colors min-[890px]:mr-1 min-[890px]:px-3 min-[890px]:hover:bg-transparent",
                  i === 1 && "hidden min-[330px]:flex",
                  i === 2 && "hidden min-[390px]:flex",
                  i >= 3 && "hidden md:flex",
                  pathname.includes(link.route)
                    ? "text-foreground"
                    : "text-muted-foreground"
                )
                const dot = NEW_DOTS[link.route] && (
                  <NewDot
                    storageKey={NEW_DOTS[link.route]}
                    triggerRoute={link.route}
                    className="absolute top-0 right-0 hidden h-2 w-2 md:flex"
                  />
                )

                if (link.route === "/tools") {
                  return (
                    <NavigationMenu.Item key={link.route}>
                      <NavigationMenu.Trigger
                        className={cn(itemClass, "group cursor-pointer")}>
                        {link.label}
                        <ChevronDown className="size-3 transition-transform group-data-[state=open]:rotate-180" />
                        {dot}
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content className="data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out w-[min(32rem,calc(100vw-1rem))] p-2">
                        <ul className="grid gap-1 sm:grid-cols-2">
                          {siteConfig.tools.map((tool) => (
                            <li key={tool.href}>
                              <NavigationMenu.Link asChild>
                                <a
                                  href={tool.href}
                                  className="hover:bg-accent flex h-full flex-col gap-1 rounded-lg p-3 transition-colors">
                                  <span className="flex items-center gap-2 text-sm font-semibold">
                                    {tool.name}
                                    {tool.isNew && <NewBadge />}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {tool.desc}
                                  </span>
                                </a>
                              </NavigationMenu.Link>
                            </li>
                          ))}
                          <li className="sm:col-span-2">
                            <NavigationMenu.Link asChild>
                              <a
                                href="/tools"
                                className="hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors">
                                All tools
                                <ArrowRight className="size-4" />
                              </a>
                            </NavigationMenu.Link>
                          </li>
                        </ul>
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>
                  )
                }

                return (
                  <NavigationMenu.Item key={link.route}>
                    <NavigationMenu.Link asChild>
                      <a href={link.route} className={itemClass}>
                        {link.label}
                        {dot}
                      </a>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>
                )
              })}
            </NavigationMenu.List>
            <div className="absolute top-full left-0 isolate z-50 flex justify-center">
              <NavigationMenu.Viewport className="origin-top-center bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-top-1 data-[state=closed]:slide-out-to-top-1 data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 relative mt-1.5 h-(--radix-navigation-menu-viewport-height) w-(--radix-navigation-menu-viewport-width) overflow-hidden rounded-xl border shadow-lg [animation-timing-function:var(--ease-out-strong)] data-[state=closed]:[animation-duration:100ms] data-[state=open]:[animation-duration:150ms] motion-reduce:animate-none" />
            </div>
          </NavigationMenu.Root>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          <TextLink href="/faq#current-semester" variant="subtle">
            <span className="text-sm whitespace-nowrap">
              {LATEST_SEMESTER_LABEL_SHORT}
            </span>
          </TextLink>

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
              <div className="flex items-center justify-between border-b px-5 pb-4">
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
