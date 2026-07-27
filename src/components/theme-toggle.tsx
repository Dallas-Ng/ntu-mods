"use client"

import { Moon, Sun } from "lucide-react"
import posthog from "posthog-js"

import { useTheme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/button"

const ThemeToggle = () => {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        const next = theme === "light" ? "dark" : "light"
        setTheme(next)
        posthog.capture("settings_theme_changed", { theme: next })
      }}>
      <Moon className="block size-5 dark:hidden" />
      <Sun className="hidden size-5 dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default ThemeToggle
