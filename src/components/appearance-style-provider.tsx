"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

import {
  APPEARANCE_DENSITIES,
  CONTRAST_PRESETS,
  DEFAULT_APPEARANCE_SETTINGS,
  INDEX_TYPE_COLOR_KEYS,
  TIMETABLE_STYLE_PRESETS
} from "@/config/appearance-settings"
import { useSettings } from "@/hooks/use-settings"

const AppearanceStyleProvider = () => {
  const { resolvedTheme } = useTheme()
  const { settings } = useSettings()
  const appearance = {
    ...DEFAULT_APPEARANCE_SETTINGS,
    ...settings.appearance
  }

  useEffect(() => {
    const root = document.documentElement
    const density =
      APPEARANCE_DENSITIES[appearance.density] ??
      APPEARANCE_DENSITIES.comfortable
    const contrast =
      CONTRAST_PRESETS[appearance.contrast] ?? CONTRAST_PRESETS.normal
    const timetable =
      TIMETABLE_STYLE_PRESETS[appearance.timetableStyle] ??
      TIMETABLE_STYLE_PRESETS.classic
    const isDark = resolvedTheme === "dark"

    root.style.setProperty(
      "--muted-foreground",
      isDark ? contrast.mutedForegroundDark : contrast.mutedForeground
    )
    root.style.setProperty("--radius", `${appearance.radius / 16}rem`)
    root.style.setProperty("--cell-padding", density.cellPadding)
    root.style.setProperty("--table-padding", density.tablePadding)
    root.style.setProperty("--index-bg-opacity-dark", timetable.opacity)
    root.style.setProperty(
      "--index-bg-opacity-dark-hover",
      timetable.opacityHover
    )

    INDEX_TYPE_COLOR_KEYS.forEach((key) => {
      const value = timetable.colors[key]

      root.style.setProperty(`--index-${key}-bg`, value.bg)
      root.style.setProperty(`--index-${key}-bg-hover`, value.bgHover)
      root.style.setProperty(`--index-${key}-bg-dark`, value.bgDark)
      root.style.setProperty(`--index-${key}-text`, value.text)
      root.style.setProperty(`--index-${key}-text-alt`, value.textAlt)
      root.style.setProperty(`--index-${key}-text-dark`, value.textDark)
      root.style.setProperty(`--index-${key}-text-alt-dark`, value.textAltDark)
      root.style.setProperty(`--index-${key}-border`, value.border)
    })
  }, [appearance, resolvedTheme])

  return null
}

export default AppearanceStyleProvider
