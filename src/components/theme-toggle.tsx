"use client"

import { useEffect, useState } from "react"
import { Coffee, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import posthog from "posthog-js"

import { Button } from "@/components/ui/button"
import { getNextTheme, type ThemeName } from "@/lib/theme-cycle"

const THEME_ICONS: Record<ThemeName, typeof Sun> = {
  light: Sun,
  dark: Moon,
  paper: Coffee
}

const ThemeToggle = () => {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Fall back to the layout's defaultTheme until mounted so the server and
  // first client render agree on which icon to paint (avoids a hydration flash).
  const current: ThemeName = mounted ? ((theme as ThemeName) ?? "dark") : "dark"
  const Icon = THEME_ICONS[current] ?? Moon

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        const next = getNextTheme(current)
        setTheme(next)
        posthog.capture("settings_theme_changed", { theme: next })
      }}>
      <Icon className="size-5" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default ThemeToggle
