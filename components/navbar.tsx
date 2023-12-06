"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList
} from "@radix-ui/react-navigation-menu"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu"
import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"

const links = [
  { label: "Stars", route: "/stars" },
  { label: "Help", route: "/help" }
]

export default function NavigationBar() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    /**
     * Upon scrolling past the top beta header, it will create a shadow in the navigation menu
     */
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
        "bg-background sticky top-0 z-40 w-full",
        scrolled && "shadow"
      )}>
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10 flex-row">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-10 w-10" />
            <span
              className={cn(
                "inline-block font-bold",
                pathname === "/"
                  ? "text-slate-950 dark:text-slate-100"
                  : "text-slate-600 dark:text-slate-400"
              )}>
              {siteConfig.name}
            </span>
          </Link>

          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                {links.map((link) => (
                  <Link
                    href={link.route}
                    key={link.route}
                    legacyBehavior
                    passHref>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "font-bold",
                        pathname === link.route
                          ? "text-slate-950 dark:text-slate-100"
                          : "text-slate-600 dark:text-slate-400"
                      )}>
                      {link.label}
                    </NavigationMenuLink>
                  </Link>
                ))}
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer">
              <div
                className={buttonVariants({ size: "icon", variant: "ghost" })}>
                <Icons.gitHub className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </div>
            </Link>

            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
