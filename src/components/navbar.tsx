"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, Moon, Settings, Sun, X } from "lucide-react"
import { useTheme } from "next-themes"

import { siteConfig } from "@/config/site"
import { LATEST_SEMESTER_LABEL_SHORT } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu"

import ThemeToggle from "./theme-toggle"
import { Button } from "./ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger
} from "./ui/drawer"

const RESOURCE_LINKS = [
  { label: "Changelog", route: "/changelog" },
  { label: "FAQ", route: "/faq" }
]

const Navbar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
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

  const primaryLinks = siteConfig.navLinks.slice(0, 2)
  const resourcesActive = RESOURCE_LINKS.some((l) =>
    pathname.startsWith(l.route)
  )

  return (
    <header
      className={cn(
        "sticky top-0 z-10 w-full backdrop-blur-xl",
        scrolled && "shadow"
      )}>
      <div className="container flex h-16 items-center gap-2 px-2 lg:px-4">
        <div className="flex min-w-0 items-center">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={30}
              height={30}
              className="size-7.5 object-contain"
              priority
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
          </Link>

          {/* Desktop nav */}
          <NavigationMenu
            className="ml-2 hidden items-center md:flex"
            viewport={false}>
            <NavigationMenuList>
              {siteConfig.navLinks.map((link) => (
                <NavigationMenuItem key={link.route}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={link.route}
                      className={cn(
                        "mr-1 px-1 text-sm font-semibold hover:text-slate-950 md:px-3 dark:hover:text-slate-100",
                        pathname.includes(link.route)
                          ? "text-slate-950 dark:text-slate-100"
                          : "text-slate-500 dark:text-slate-400"
                      )}>
                      {link.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}

              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "text-sm font-semibold",
                    resourcesActive
                      ? "text-slate-950 dark:text-slate-100"
                      : "text-slate-500 dark:text-slate-400"
                  )}>
                  Resources
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="flex w-36 flex-col gap-1 p-1">
                    {RESOURCE_LINKS.map((link) => (
                      <li key={link.route}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={link.route}
                            className={cn(
                              "hover:bg-accent hover:text-accent-foreground block rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                              pathname.startsWith(link.route)
                                ? "text-foreground"
                                : "text-muted-foreground"
                            )}>
                            {link.label}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Mobile inline quick links */}
          <nav className="ml-2 flex min-w-0 items-center gap-1 md:hidden">
            {primaryLinks.map((link) => (
              <Link
                href={link.route}
                key={link.route}
                className={cn(
                  "hover:bg-accent hover:text-foreground rounded-md px-2 py-1.5 text-sm font-semibold transition-colors",
                  pathname.includes(link.route)
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          <Link href="/faq#current-semester" className="hover:underline">
            <span className="text-sm">{LATEST_SEMESTER_LABEL_SHORT}</span>
          </Link>

          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          <Button
            aria-label="Settings Button"
            size="icon"
            variant="ghost"
            className="hidden md:inline-flex"
            onClick={() => router.push("/settings")}>
            <Settings className="size-5" />
          </Button>

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
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={24}
                    height={24}
                    className="size-6 object-contain"
                  />
                  <span className="font-bold">{siteConfig.name}</span>
                </Link>
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
                    <Link
                      href={link.route}
                      className={cn(
                        "hover:bg-accent rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                        pathname.includes(link.route)
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}>
                      {link.label}
                    </Link>
                  </DrawerClose>
                ))}

                {/* Resources section */}
                <div className="mt-4 border-t pt-4">
                  <p className="text-muted-foreground/60 mb-1 px-4 text-[11px] font-semibold tracking-widest uppercase">
                    Resources
                  </p>
                  {RESOURCE_LINKS.map((link) => (
                    <DrawerClose key={link.route} asChild>
                      <Link
                        href={link.route}
                        className={cn(
                          "hover:bg-accent block rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                          pathname.startsWith(link.route)
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}>
                        {link.label}
                      </Link>
                    </DrawerClose>
                  ))}
                </div>
              </nav>

              {/* Footer */}
              <div className="mt-auto border-t p-3">
                <DrawerClose asChild>
                  <button
                    onClick={() => router.push("/settings")}
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
