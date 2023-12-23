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
import { Icons } from "@/components/icons"

// import { ThemeToggle } from "@/components/theme-toggle"

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
        "sticky top-0 z-10 w-full bg-background",
        scrolled && "shadow"
      )}>
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-3">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo width={30} height={30} />
            <span
              className={cn(
                "inline-block font-bold hover:text-slate-950 dark:hover:text-slate-100",
                pathname === "/"
                  ? "text-slate-950 dark:text-slate-100"
                  : "text-slate-500 dark:text-slate-400"
              )}>
              {siteConfig.name}
            </span>
          </Link>

          <NavigationMenu className="flex items-center">
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
                        "mr-1 p-3 text-sm font-semibold transition-colors duration-300 hover:text-slate-950 dark:hover:text-slate-100",
                        pathname === link.route
                          ? "text-slate-950 dark:text-slate-100"
                          : "text-slate-500 dark:text-slate-400"
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
          <nav className="flex items-center space-x-1 pr-1 sm:pr-0">
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

            {/* <ThemeToggle /> */}
          </nav>
        </div>
      </div>
    </header>
  )
}
