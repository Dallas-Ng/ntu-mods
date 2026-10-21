"use client"

import { MessageSquare, Moon, Sun } from "lucide-react"

import { track } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { usePathname } from "@/hooks/use-pathname"
import { useTheme } from "@/hooks/use-theme"

import { Button } from "./ui/button"

// Same grey as the nav text links: solid only on hover or on its own page.
export const NAV_ICON =
  "text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"

const NavActions = () => {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const next = theme === "light" ? "dark" : "light"

  return (
    <div className="flex items-center">
      <Button
        aria-label={`Switch to ${next} mode`}
        title={`Switch to ${next} mode`}
        variant="ghost"
        size="icon"
        className={NAV_ICON}
        onClick={() => {
          setTheme(next)
          track("settings_theme_changed", { theme: next })
        }}>
        {theme === "light" ? (
          <Moon className="size-5" />
        ) : (
          <Sun className="size-5" />
        )}
      </Button>
      <Button
        asChild
        aria-label="Feedback"
        title="Feedback"
        variant="ghost"
        size="icon"
        className={cn(NAV_ICON, pathname === "/feedback" && "text-foreground")}>
        <a href="/feedback">
          <MessageSquare className="size-5" />
        </a>
      </Button>
    </div>
  )
}

export default NavActions
