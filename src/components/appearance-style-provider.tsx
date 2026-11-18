"use client"

import { useEffect, useMemo } from "react"

import {
  APPEARANCE_DENSITIES,
  CONTRAST_PRESETS,
  INDEX_TYPE_COLOR_KEYS,
  withAppearanceDefaults
} from "@/config/appearance-settings"
import { getIndexTypeVars, getTimetablePreset } from "@/lib/index-type-colors"
import { useSettings } from "@/hooks/use-settings"
import { useTheme } from "@/hooks/use-theme"

const AppearanceStyleProvider = () => {
  const { resolvedTheme } = useTheme()
  const { settings } = useSettings()
  // Memoized so the effect below runs on real appearance changes rather than
  // on every render, a fresh object literal would change identity each time.
  const appearance = useMemo(
    () => withAppearanceDefaults(settings.appearance),
    [settings.appearance]
  )

  useEffect(() => {
    const root = document.documentElement
    const density =
      APPEARANCE_DENSITIES[appearance.density] ??
      APPEARANCE_DENSITIES.comfortable
    const contrast =
      CONTRAST_PRESETS[appearance.contrast] ?? CONTRAST_PRESETS.normal
    const isDark = resolvedTheme === "dark"

    root.style.setProperty(
      "--muted-foreground",
      isDark ? contrast.mutedForegroundDark : contrast.mutedForeground
    )
    root.style.setProperty("--radius", `${appearance.radius / 16}rem`)
    root.style.setProperty("--cell-padding", density.cellPadding)
    root.style.setProperty("--table-padding", density.tablePadding)

    // Custom blocks and lunch keep the palette's shared alpha; only the six
    // class types have their own.
    const preset = getTimetablePreset(appearance.timetableStyle)
    root.style.setProperty("--index-bg-opacity-dark", preset.opacity)
    root.style.setProperty("--index-bg-opacity-dark-hover", preset.opacityHover)

    INDEX_TYPE_COLOR_KEYS.forEach((key) => {
      const vars = getIndexTypeVars(
        appearance.timetableStyle,
        key,
        appearance.granularColors ? appearance.typeOverrides?.[key] : undefined
      )

      Object.entries(vars).forEach(([name, value]) => {
        root.style.setProperty(name, value)
      })
    })
  }, [appearance, resolvedTheme])

  return null
}

export default AppearanceStyleProvider
