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
  // Same value on the server and the first client render ("dark" is the stored
  // default); reading localStorage here made the SSR'd navbar disagree with
  // the client for light-theme users and forced a hydration re-render.
  const [theme, setThemeState] = useState<Theme>("dark")

  useEffect(() => {
    setThemeState(readStoredTheme())
  }, [])

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
