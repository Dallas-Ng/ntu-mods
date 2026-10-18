"use client"

import { Moon, Settings, Sun } from "lucide-react"

import { track } from "@/lib/analytics"
import { useTheme } from "@/hooks/use-theme"

import { Button } from "./ui/button"

const NavActions = () => {
  const { theme, setTheme } = useTheme()
  const next = theme === "light" ? "dark" : "light"

  return (
    <div className="flex items-center">
      <Button
        aria-label={`Switch to ${next} mode`}
        title={`Switch to ${next} mode`}
        variant="ghost"
        size="icon"
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
        aria-label="Settings"
        title="Settings"
        variant="ghost"
        size="icon">
        <a href="/settings">
          <Settings className="size-5" />
        </a>
      </Button>
    </div>
  )
}

export default NavActions
