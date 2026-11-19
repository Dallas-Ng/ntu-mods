import {
  TIMETABLE_STYLE_PRESETS,
  type AppearanceSettings,
  type IndexTypeColorKey,
  type IndexTypeStyleOverride,
  type TimetableStylePreset
} from "@/config/appearance-settings"

const COLOR_TOKEN_KEYS = [
  "bg",
  "bgHover",
  "bgDark",
  "text",
  "textAlt",
  "textDark",
  "textAltDark",
  "border"
] as const

/** `bgHover` -> `bg-hover`, matching the CSS variable names in globals.css. */
const tokenToVar = (token: string) =>
  token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

export const clampOpacity = (opacity: number) =>
  Math.min(100, Math.max(0, Math.round(opacity)))

export const getTimetablePreset = (style: TimetableStylePreset) =>
  TIMETABLE_STYLE_PRESETS[style] ?? TIMETABLE_STYLE_PRESETS.classic

/** The hue and saturation of a picked colour. Lightness is not part of it. */
interface Tint {
  hue: number
  saturation: number
}

/**
 * Turns a picked hex colour into the hue and saturation that retint a palette.
 * The picker's lightness is dropped on purpose: every token keeps the palette's
 * own lightness, which is what guarantees the text pairs stay readable. Greys
 * keep zero saturation, so they stay grey.
 */
export const hexToTint = (hex: string): Tint | null => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return null

  const value =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((part) => part + part)
          .join("")
      : match[1]

  const r = parseInt(value.slice(0, 2), 16) / 255
  const g = parseInt(value.slice(2, 4), 16) / 255
  const b = parseInt(value.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const lightness = (max + min) / 2

  if (delta === 0) return { hue: 0, saturation: 0 }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))

  let hue: number
  if (max === r) hue = ((g - b) / delta) % 6
  else if (max === g) hue = (b - r) / delta + 2
  else hue = (r - g) / delta + 4

  hue *= 60
  if (hue < 0) hue += 360

  return { hue: Math.round(hue), saturation: Math.round(saturation * 100) }
}

/**
 * Replaces a palette token's hue and saturation with the picked colour's,
 * keeping the palette's lightness. The token keeps its `H S% L%` shape, so the
 * existing `hsl(var(--token)/alpha)` classes read it unchanged.
 */
export const tintToken = (token: string, tint: Tint) => {
  const [, , lightness] = token.trim().split(/\s+/)
  if (!lightness) return token

  const hue = ((Math.round(tint.hue) % 360) + 360) % 360
  const saturation = Math.min(100, Math.max(0, Math.round(tint.saturation)))

  return `${hue} ${saturation}% ${lightness}`
}

/** An `H S% L%` token as a hex colour, for a native colour input. */
export const hslTokenToHex = (token: string) => {
  const [hueText = "0", saturationText = "0%", lightnessText = "0%"] = token
    .trim()
    .split(/\s+/)
  const hue = Number(hueText) || 0
  const saturation = (Number(saturationText.replace("%", "")) || 0) / 100
  const lightness = (Number(lightnessText.replace("%", "")) || 0) / 100

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const match = lightness - chroma / 2

  let rgb: [number, number, number]
  if (hue < 60) rgb = [chroma, second, 0]
  else if (hue < 120) rgb = [second, chroma, 0]
  else if (hue < 180) rgb = [0, chroma, second]
  else if (hue < 240) rgb = [0, second, chroma]
  else if (hue < 300) rgb = [second, 0, chroma]
  else rgb = [chroma, 0, second]

  const toHex = (channel: number) =>
    Math.round((channel + match) * 255)
      .toString(16)
      .padStart(2, "0")

  return `#${rgb.map(toHex).join("")}`
}

/** The hex a type shows when it has no colour of its own. */
export const getPaletteHex = (
  style: TimetableStylePreset,
  key: IndexTypeColorKey
) => hslTokenToHex(getTimetablePreset(style).colors[key].bg)

/**
 * A module's own override wins field by field over the type default, so a
 * module that only sets opacity keeps the type's colour.
 */
export const mergeTypeOverride = (
  typeOverride?: IndexTypeStyleOverride,
  moduleOverride?: IndexTypeStyleOverride
): IndexTypeStyleOverride | undefined => {
  if (!typeOverride && !moduleOverride) return undefined

  return {
    color: moduleOverride?.color ?? typeOverride?.color,
    opacity: moduleOverride?.opacity ?? typeOverride?.opacity
  }
}

/** The override a cell uses before the granular switch is considered. */
export const getEffectiveOverride = (
  appearance: AppearanceSettings,
  key: IndexTypeColorKey,
  moduleKey?: string
) =>
  moduleKey
    ? mergeTypeOverride(
        appearance.typeOverrides?.[key],
        appearance.moduleOverrides?.[moduleKey]?.[key]
      )
    : appearance.typeOverrides?.[key]

/**
 * The override that actually applies. With granular control off the palette is
 * drawn exactly as designed, though the saved overrides are kept for when it is
 * switched back on.
 */
export const getActiveOverride = (
  appearance: AppearanceSettings,
  key: IndexTypeColorKey,
  moduleKey?: string
) =>
  appearance.granularColors
    ? getEffectiveOverride(appearance, key, moduleKey)
    : undefined

/**
 * Every custom property one class type's cells read. Writing these on an
 * element re-tints that element and everything inside it, which is how a single
 * module overrides its own blocks without touching the palette. Opacity is not
 * in here: the cell applies it to the whole block so the fill, text and border
 * fade together.
 */
export const getIndexTypeVars = (
  timetableStyle: TimetableStylePreset,
  key: IndexTypeColorKey,
  override?: IndexTypeStyleOverride
): Record<string, string> => {
  const preset = getTimetablePreset(timetableStyle)
  const tokens = preset.colors[key]
  const tint = override?.color ? hexToTint(override.color) : null

  const vars: Record<string, string> = {}

  COLOR_TOKEN_KEYS.forEach((token) => {
    const value = tokens[token]
    vars[`--index-${key}-${tokenToVar(token)}`] = tint
      ? tintToken(value, tint)
      : value
  })

  return vars
}

/**
 * Vars for a module's cell, or nothing when the module does not override this
 * type or granular control is off. Types without a module override already read
 * the root vars.
 */
export const getModuleCellVars = (
  appearance: AppearanceSettings,
  moduleKey: string,
  key: IndexTypeColorKey
) => {
  if (!appearance.granularColors) return undefined

  const moduleOverride = appearance.moduleOverrides?.[moduleKey]?.[key]
  if (!moduleOverride) return undefined

  return getIndexTypeVars(
    appearance.timetableStyle,
    key,
    mergeTypeOverride(appearance.typeOverrides?.[key], moduleOverride)
  )
}
