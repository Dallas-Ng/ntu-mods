"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import posthog from "posthog-js"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { THEME_META, THEME_ORDER, type ThemeName } from "@/lib/theme-cycle"

const ThemeToggle = () => {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Fall back to the layout's defaultTheme until mounted so the server and
  // first client render agree on which icon to paint (avoids a hydration flash).
  const current: ThemeName = mounted ? ((theme as ThemeName) ?? "dark") : "dark"
  const Icon = THEME_META[current]?.icon ?? THEME_META.dark.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          <Icon className="size-5" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(next) => {
            setTheme(next)
            posthog.capture("settings_theme_changed", { theme: next })
          }}>
          {THEME_ORDER.map((key) => {
            const ItemIcon = THEME_META[key].icon
            return (
              <DropdownMenuRadioItem key={key} value={key}>
                <ItemIcon className="size-4" />
                {THEME_META[key].label}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ThemeToggle
