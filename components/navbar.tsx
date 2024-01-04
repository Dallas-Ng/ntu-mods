"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Github } from "lucide-react"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList
} from "@/components/ui/navigation-menu"

import { Skeleton } from "./ui/skeleton"

const ThemeToggle = dynamic(() => import("@/components/theme-toggle"), {
  ssr: false,
  loading: () => <Skeleton className="h-10 w-10" />
})

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
        "sticky top-0 z-10 w-full backdrop-blur-xl",
        scrolled && "shadow"
      )}>
      <div className="container flex h-16 items-center space-x-2 px-2 sm:justify-between sm:space-x-0 md:px-0">
        <div className="flex gap-3">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="Logo" width={30} height={30} priority />

            <span
              className={cn(
                "hidden font-bold hover:text-slate-950 dark:hover:text-slate-100 md:inline-block",
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
                {siteConfig.navLinks.map((link) => (
                  <Link
                    href={link.route}
                    key={link.route}
                    legacyBehavior
                    passHref>
                    <NavigationMenuLink
                      className={cn(
                        "mr-1 p-2 text-sm font-semibold hover:text-slate-950 dark:hover:text-slate-100 md:p-3",
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

        <div className="flex flex-1 items-center justify-end">
          <Button asChild size="icon" variant="ghost">
            <Link href={siteConfig.links.repo} target="_blank" rel="noreferrer">
              <Github className="h-5 w-5" />
            </Link>
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
