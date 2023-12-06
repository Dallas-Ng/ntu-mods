"use client"

import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

import { Icons } from "./icons"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      <Icons.moon className="h-5 w-5 dark:hidden" />
      <Icons.sun className="hidden h-5 w-5 dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
