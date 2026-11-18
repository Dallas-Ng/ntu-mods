"use client"

import { useMemo } from "react"
import { Palette } from "lucide-react"

import {
  INDEX_TYPE_COLOR_KEYS,
  withAppearanceDefaults,
  type IndexTypeColorKey,
  type IndexTypeStyleOverride
} from "@/config/appearance-settings"
import { getIndexColorKey } from "@/lib/get-index-type"
import { getEffectiveOverride } from "@/lib/index-type-colors"
import { latestSemester, latestYear } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useSettings } from "@/hooks/use-settings"

import ColourOverlay from "./colour-overlay"
import IndexTypeColourPanel from "./index-type-colour-panel"

interface Props {
  moduleKey: string
  indexKey: string
}

/**
 * The palette button in a module's row, next to remove. It opens that
 * module's class types, each with the same colour picker and opacity control
 * as the six class boxes in Appearance.
 */
const TimetableModuleColours = ({ moduleKey, indexKey }: Props) => {
  const { settings, updateSettings } = useSettings()
  const { indexes } = useSeasonIndexes(latestYear, latestSemester)
  const appearance = withAppearanceDefaults(settings.appearance)

  // Only the types this module actually runs, in the site's usual order.
  // Data can still be loading; fall back to everything the module offers so
  // the control does not disappear while the file arrives.
  const types = useMemo(() => {
    const moduleIndexes = indexes[moduleKey] ?? {}
    const found = new Set<IndexTypeColorKey>()

    ;(moduleIndexes[indexKey] ?? []).forEach((slot) =>
      found.add(getIndexColorKey(slot.type))
    )

    if (found.size === 0) {
      Object.values(moduleIndexes)
        .flat()
        .forEach((slot) => found.add(getIndexColorKey(slot.type)))
    }

    return INDEX_TYPE_COLOR_KEYS.filter((key) => found.has(key))
  }, [indexes, moduleKey, indexKey])

  // Without granular control the palette is drawn as designed, so there is
  // nothing here to edit.
  if (!appearance.granularColors || types.length === 0) return null

  const overrides = appearance.moduleOverrides[moduleKey]
  const hasOverride = Object.keys(overrides ?? {}).length > 0

  const updateType = (
    key: IndexTypeColorKey,
    next: IndexTypeStyleOverride | undefined
  ) => {
    const moduleOverrides = { ...appearance.moduleOverrides }
    const current = { ...(moduleOverrides[moduleKey] ?? {}) }

    if (!next) delete current[key]
    else current[key] = next

    if (Object.keys(current).length === 0) delete moduleOverrides[moduleKey]
    else moduleOverrides[moduleKey] = current

    updateSettings({ appearance: { ...appearance, moduleOverrides } })
  }

  return (
    <ColourOverlay
      align="end"
      isolate
      title={`${moduleKey} colours`}
      className="max-h-[70vh] w-80 overflow-y-auto p-3"
      trigger={
        <button
          type="button"
          aria-label={`Edit ${moduleKey} colours`}
          className="flex size-8 items-center justify-center">
          <Palette
            className={cn(
              "size-4 transition-colors",
              hasOverride
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          />
        </button>
      }>
      <div className="space-y-2">
        <p className="text-muted-foreground hidden text-xs sm:block">
          {moduleKey} colours. Only this module changes.
        </p>

        {types.map((key) => (
          <IndexTypeColourPanel
            key={key}
            inline
            type={key}
            appearance={appearance}
            override={overrides?.[key]}
            effective={getEffectiveOverride(appearance, key, moduleKey)}
            onChange={(next) => updateType(key, next)}
            moduleKey={moduleKey}
          />
        ))}
      </div>
    </ColourOverlay>
  )
}

export default TimetableModuleColours
