"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, Settings } from "lucide-react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "./ui/dropdown-menu"

const Navbar = () => {
  const pathname = usePathname()
  const router = useRouter()
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
  const menuLinks = siteConfig.navLinks.slice(2)

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
              className="size-[30px] object-contain"
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

          <NavigationMenu className="ml-2 hidden items-center md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                {siteConfig.navLinks.map((link) => (
                  <NavigationMenuLink key={link.route} asChild>
                    <Link
                      href={link.route}
                      className={cn(
                        "mr-1 p-1 text-sm font-semibold hover:text-slate-950 md:p-3 dark:hover:text-slate-100",
                        pathname.includes(link.route)
                          ? "text-slate-950 dark:text-slate-100"
                          : "text-slate-500 dark:text-slate-400"
                      )}>
                      {link.label}
                    </Link>
                  </NavigationMenuLink>
                ))}
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

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
          <ThemeToggle />

          <Button
            aria-label="Settings Button"
            size="icon"
            variant="ghost"
            className="hidden md:inline-flex"
            onClick={() => router.push("/settings")}>
            <Settings className="size-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open navigation menu"
                size="icon"
                variant="ghost"
                className="md:hidden">
                <Menu className="size-5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              {menuLinks.map((link) => (
                <DropdownMenuItem key={link.route} asChild>
                  <Link
                    href={link.route}
                    className={cn(
                      pathname.includes(link.route) && "text-foreground"
                    )}>
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}

              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default Navbar
