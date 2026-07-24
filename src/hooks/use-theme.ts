"use client"

import { useCallback, useEffect, useState } from "react"

export type Theme = "light" | "dark" | "system"

export const THEME_STORAGE_KEY = "theme"
const THEME_CHANGE_EVENT = "ntumods:theme-change"

const getSystemTheme = (): "light" | "dark" =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"

const readStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "dark"
  return (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? "dark"
}

export const applyTheme = (theme: Theme) => {
  const resolved = theme === "system" ? getSystemTheme() : theme
  document.documentElement.classList.toggle("dark", resolved === "dark")
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    const syncFromStorage = () => setThemeState(readStoredTheme())
    window.addEventListener(THEME_CHANGE_EVENT, syncFromStorage)
    window.addEventListener("storage", syncFromStorage)
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, syncFromStorage)
      window.removeEventListener("storage", syncFromStorage)
    }
  }, [])

  useEffect(() => {
    if (theme !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyTheme("system")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, next)
    applyTheme(next)
    setThemeState(next)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }, [])

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme

  return { theme, setTheme, resolvedTheme }
}
