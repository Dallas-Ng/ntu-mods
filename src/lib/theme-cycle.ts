export const THEME_ORDER = ["light", "dark", "paper"] as const

export type ThemeName = (typeof THEME_ORDER)[number]

export const getNextTheme = (current?: string): ThemeName => {
  const index = THEME_ORDER.indexOf(current as ThemeName)
  return THEME_ORDER[(index + 1) % THEME_ORDER.length]
}
