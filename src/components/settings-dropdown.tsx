"use client"

import { Moon, Settings, Sun } from "lucide-react"
import posthog from "posthog-js"

import { useTheme } from "@/hooks/use-theme"

import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "./ui/dropdown-menu"

const SettingsDropdown = () => {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Settings menu" variant="ghost" size="icon">
          <Settings className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href="/settings" className="flex items-center gap-2">
            <Settings className="size-4" />
            Settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            const next = theme === "light" ? "dark" : "light"
            setTheme(next)
            posthog.capture("settings_theme_changed", { theme: next })
          }}
          className="gap-2">
          {theme === "light" ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
          {theme === "light" ? "Dark mode" : "Light mode"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SettingsDropdown
