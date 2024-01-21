"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Settings } from "lucide-react"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList
} from "@/components/ui/navigation-menu"

import ThemeToggle from "./theme-toggle"
import { Button } from "./ui/button"

const Navbar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

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
      <div className="container flex h-16 items-center px-2 lg:px-4">
        <div className="flex">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={30}
              height={30}
              className="size-[30px] object-contain"
              priority
            />

            <span
              className={cn(
                "ml-1 hidden font-bold hover:text-slate-950 dark:hover:text-slate-100 md:inline-block",
                pathname === "/"
                  ? "text-slate-950 dark:text-slate-100"
                  : "text-slate-500 dark:text-slate-400"
              )}>
              {siteConfig.name}
            </span>
          </Link>

          <NavigationMenu className="ml-2 flex items-center">
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
                        "mr-1 p-1 text-sm font-semibold hover:text-slate-950 dark:hover:text-slate-100 md:p-3",
                        pathname.includes(link.route)
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
          <ThemeToggle />

          <Button
            aria-label="Settings Button"
            size="icon"
            variant="ghost"
            onClick={() => router.push("/settings")}>
            <Settings className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
