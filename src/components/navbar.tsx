"use client"

import { useEffect, useState } from "react"
import { Menu, Moon, Settings, Sparkles, Sun, X } from "lucide-react"

import { siteConfig } from "@/config/site"
import { LATEST_SEMESTER_LABEL_SHORT } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useChangelogUnseenCount } from "@/hooks/use-changelog-unseen"
import { usePathname } from "@/hooks/use-pathname"
import { useTheme } from "@/hooks/use-theme"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList
} from "@/components/ui/navigation-menu"

import ChangelogButton from "./changelog-button"
import { NewDot } from "./new-dot"
import SettingsDropdown from "./settings-dropdown"
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
                "ml-1 hidden font-bold hover:text-slate-950 md:inline-block dark:hover:text-slate-100",
                pathname === "/"
                  ? "text-slate-950 dark:text-slate-100"
                  : "text-slate-500 dark:text-slate-400"
              )}>
              {siteConfig.name}
            </span>
          </a>

          {/* Desktop nav */}
          <NavigationMenu
            className="ml-2 hidden items-center md:flex"
            viewport={false}>
            <NavigationMenuList>
              {siteConfig.navLinks.map((link) => (
                <NavigationMenuItem key={link.route}>
                  <NavigationMenuLink asChild>
                    <a
                      href={link.route}
                      className={cn(
                        "relative mr-1 px-1 text-sm font-semibold hover:bg-transparent hover:text-slate-950 md:px-3 dark:hover:text-slate-100",
                        pathname.includes(link.route)
                          ? "text-slate-950 dark:text-slate-100"
                          : "text-slate-500 dark:text-slate-400"
                      )}>
                      {link.label}
                      {link.route === "/exams" && (
                        <NewDot
                          storageKey="seen-exams"
                          triggerRoute="/exams"
                          className="absolute top-0 right-0 hidden h-2 w-2 md:flex"
                        />
                      )}
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Mobile inline quick links */}
          <nav className="ml-2 flex items-center gap-1 md:hidden">
            {siteConfig.navLinks.map((link, i) => (
              <a
                href={link.route}
                key={link.route}
                className={cn(
                  "hover:bg-accent hover:text-foreground rounded-md px-2 py-1.5 text-sm font-semibold transition-colors",
                  i === 2 && "hidden min-[420px]:flex",
                  i === 3 && "hidden min-[520px]:flex",
                  i === 4 && "hidden min-[640px]:flex",
                  pathname.includes(link.route)
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}>
                {link.label}
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
            <SettingsDropdown />
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
                    className="hover:bg-accent text-muted-foreground flex w-full items-center justify-between gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors">
                    <span className="flex items-center gap-3">
                      <Sparkles className="size-4" />
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
                    className="hover:bg-accent text-muted-foreground flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors">
                    <Settings className="size-4" />
                    Settings
                  </button>
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
