export const INDEX_TYPE_COLOR_KEYS = [
  "lec",
  "lab",
  "sem",
  "tut",
  "des",
  "prj"
] as const

export type IndexTypeColorKey = (typeof INDEX_TYPE_COLOR_KEYS)[number]

export interface TimetableColorToken {
  bg: string
  bgHover: string
  bgDark: string
  text: string
  textAlt: string
  textDark: string
  textAltDark: string
  border: string
}

type TimetablePalette = {
  label: string
  description: string
  opacity: string
  opacityHover: string
  colors: Record<IndexTypeColorKey, TimetableColorToken>
}

export const TIMETABLE_STYLE_PRESETS = {
  classic: {
    label: "Classic",
    description: "The familiar NTUMods class-type mapping.",
    opacity: "0.20",
    opacityHover: "0.28",
    colors: {
      lec: {
        bg: "174 72% 88%",
        bgHover: "174 72% 82%",
        bgDark: "174 72% 65%",
        text: "174 72% 26%",
        textAlt: "174 72% 40%",
        textDark: "174 72% 65%",
        textAltDark: "174 72% 56%",
        border: "174 72% 40%"
      },
      lab: {
        bg: "84 70% 88%",
        bgHover: "84 70% 82%",
        bgDark: "84 70% 62%",
        text: "84 70% 24%",
        textAlt: "84 70% 38%",
        textDark: "84 70% 62%",
        textAltDark: "84 70% 53%",
        border: "84 70% 38%"
      },
      sem: {
        bg: "45 93% 88%",
        bgHover: "45 93% 82%",
        bgDark: "45 93% 68%",
        text: "45 93% 33%",
        textAlt: "45 93% 47%",
        textDark: "45 93% 68%",
        textAltDark: "45 93% 59%",
        border: "45 93% 47%"
      },
      tut: {
        bg: "199 89% 88%",
        bgHover: "199 89% 82%",
        bgDark: "199 89% 67%",
        text: "199 89% 34%",
        textAlt: "199 89% 48%",
        textDark: "199 89% 67%",
        textAltDark: "199 89% 58%",
        border: "199 89% 48%"
      },
      des: {
        bg: "239 84% 88%",
        bgHover: "239 84% 82%",
        bgDark: "239 84% 73%",
        text: "239 84% 38%",
        textAlt: "239 84% 67%",
        textDark: "239 84% 73%",
        textAltDark: "239 84% 64%",
        border: "239 84% 67%"
      },
      prj: {
        bg: "346 77% 88%",
        bgHover: "346 77% 82%",
        bgDark: "346 77% 68%",
        text: "346 77% 36%",
        textAlt: "346 77% 50%",
        textDark: "346 77% 68%",
        textAltDark: "346 77% 59%",
        border: "346 77% 50%"
      }
    }
  },
  soft: {
    label: "Soft",
    description: "Muted cells for long planning sessions.",
    opacity: "0.14",
    opacityHover: "0.22",
    colors: {
      lec: {
        bg: "174 45% 94%",
        bgHover: "174 45% 88%",
        bgDark: "174 48% 64%",
        text: "174 46% 27%",
        textAlt: "174 48% 38%",
        textDark: "174 48% 68%",
        textAltDark: "174 44% 58%",
        border: "174 48% 42%"
      },
      lab: {
        bg: "88 42% 93%",
        bgHover: "88 42% 87%",
        bgDark: "88 45% 63%",
        text: "88 45% 25%",
        textAlt: "88 46% 36%",
        textDark: "88 45% 67%",
        textAltDark: "88 42% 56%",
        border: "88 46% 38%"
      },
      sem: {
        bg: "44 58% 94%",
        bgHover: "44 58% 88%",
        bgDark: "44 62% 66%",
        text: "44 58% 30%",
        textAlt: "44 60% 42%",
        textDark: "44 62% 70%",
        textAltDark: "44 58% 60%",
        border: "44 60% 44%"
      },
      tut: {
        bg: "202 50% 94%",
        bgHover: "202 50% 88%",
        bgDark: "202 52% 66%",
        text: "202 52% 31%",
        textAlt: "202 54% 43%",
        textDark: "202 52% 70%",
        textAltDark: "202 50% 60%",
        border: "202 54% 45%"
      },
      des: {
        bg: "250 48% 94%",
        bgHover: "250 48% 88%",
        bgDark: "250 50% 70%",
        text: "250 50% 34%",
        textAlt: "250 52% 50%",
        textDark: "250 50% 73%",
        textAltDark: "250 48% 64%",
        border: "250 52% 54%"
      },
      prj: {
        bg: "340 48% 94%",
        bgHover: "340 48% 88%",
        bgDark: "340 50% 68%",
        text: "340 50% 33%",
        textAlt: "340 52% 46%",
        textDark: "340 50% 72%",
        textAltDark: "340 48% 62%",
        border: "340 52% 50%"
      }
    }
  },
  vivid: {
    label: "Vivid",
    description: "Punchier blocks while keeping type identity clear.",
    opacity: "0.30",
    opacityHover: "0.38",
    colors: {
      lec: {
        bg: "174 85% 82%",
        bgHover: "174 85% 76%",
        bgDark: "174 84% 66%",
        text: "174 88% 20%",
        textAlt: "174 88% 35%",
        textDark: "174 88% 70%",
        textAltDark: "174 84% 58%",
        border: "174 88% 36%"
      },
      lab: {
        bg: "92 82% 82%",
        bgHover: "92 82% 76%",
        bgDark: "92 82% 64%",
        text: "92 84% 18%",
        textAlt: "92 84% 33%",
        textDark: "92 84% 68%",
        textAltDark: "92 80% 56%",
        border: "92 84% 34%"
      },
      sem: {
        bg: "45 100% 80%",
        bgHover: "45 100% 74%",
        bgDark: "45 100% 68%",
        text: "45 100% 24%",
        textAlt: "45 100% 40%",
        textDark: "45 100% 72%",
        textAltDark: "45 96% 60%",
        border: "45 100% 42%"
      },
      tut: {
        bg: "199 100% 82%",
        bgHover: "199 100% 76%",
        bgDark: "199 100% 67%",
        text: "199 100% 25%",
        textAlt: "199 100% 42%",
        textDark: "199 100% 72%",
        textAltDark: "199 96% 60%",
        border: "199 100% 44%"
      },
      des: {
        bg: "252 96% 84%",
        bgHover: "252 96% 78%",
        bgDark: "252 96% 72%",
        text: "252 98% 30%",
        textAlt: "252 98% 54%",
        textDark: "252 98% 76%",
        textAltDark: "252 92% 64%",
        border: "252 98% 58%"
      },
      prj: {
        bg: "340 96% 84%",
        bgHover: "340 96% 78%",
        bgDark: "340 96% 70%",
        text: "340 98% 28%",
        textAlt: "340 98% 48%",
        textDark: "340 98% 74%",
        textAltDark: "340 92% 62%",
        border: "340 98% 50%"
      }
    }
  },
  candy: {
    label: "Candy",
    description: "Brighter pastel class blocks with a playful feel.",
    opacity: "0.24",
    opacityHover: "0.32",
    colors: {
      lec: {
        bg: "176 86% 86%",
        bgHover: "176 86% 80%",
        bgDark: "176 82% 70%",
        text: "176 80% 24%",
        textAlt: "176 82% 42%",
        textDark: "176 82% 74%",
        textAltDark: "176 78% 62%",
        border: "176 82% 44%"
      },
      lab: {
        bg: "146 74% 86%",
        bgHover: "146 74% 80%",
        bgDark: "146 72% 68%",
        text: "146 78% 24%",
        textAlt: "146 76% 40%",
        textDark: "146 72% 72%",
        textAltDark: "146 68% 60%",
        border: "146 76% 42%"
      },
      sem: {
        bg: "42 98% 84%",
        bgHover: "42 98% 78%",
        bgDark: "42 96% 72%",
        text: "42 92% 28%",
        textAlt: "42 96% 48%",
        textDark: "42 96% 76%",
        textAltDark: "42 92% 64%",
        border: "42 96% 50%"
      },
      tut: {
        bg: "205 96% 86%",
        bgHover: "205 96% 80%",
        bgDark: "205 92% 72%",
        text: "205 88% 30%",
        textAlt: "205 92% 52%",
        textDark: "205 92% 76%",
        textAltDark: "205 88% 64%",
        border: "205 92% 54%"
      },
      des: {
        bg: "266 94% 88%",
        bgHover: "266 94% 82%",
        bgDark: "266 90% 75%",
        text: "266 86% 34%",
        textAlt: "266 90% 60%",
        textDark: "266 90% 78%",
        textAltDark: "266 86% 66%",
        border: "266 90% 62%"
      },
      prj: {
        bg: "332 94% 88%",
        bgHover: "332 94% 82%",
        bgDark: "332 90% 73%",
        text: "332 86% 32%",
        textAlt: "332 90% 56%",
        textDark: "332 90% 76%",
        textAltDark: "332 86% 64%",
        border: "332 90% 58%"
      }
    }
  },
  terminal: {
    label: "80s Terminal",
    description: "Green-screen energy, with class types split by shade.",
    opacity: "0.36",
    opacityHover: "0.44",
    colors: {
      lec: {
        bg: "100 62% 82%",
        bgHover: "100 62% 76%",
        bgDark: "100 82% 62%",
        text: "100 82% 20%",
        textAlt: "100 82% 34%",
        textDark: "100 92% 72%",
        textAltDark: "100 88% 60%",
        border: "100 82% 36%"
      },
      lab: {
        bg: "118 58% 82%",
        bgHover: "118 58% 76%",
        bgDark: "118 78% 61%",
        text: "118 78% 19%",
        textAlt: "118 78% 33%",
        textDark: "118 88% 71%",
        textAltDark: "118 84% 59%",
        border: "118 78% 35%"
      },
      sem: {
        bg: "136 54% 82%",
        bgHover: "136 54% 76%",
        bgDark: "136 74% 62%",
        text: "136 74% 20%",
        textAlt: "136 74% 34%",
        textDark: "136 84% 72%",
        textAltDark: "136 80% 60%",
        border: "136 74% 36%"
      },
      tut: {
        bg: "154 50% 82%",
        bgHover: "154 50% 76%",
        bgDark: "154 72% 63%",
        text: "154 72% 21%",
        textAlt: "154 72% 35%",
        textDark: "154 82% 73%",
        textAltDark: "154 78% 61%",
        border: "154 72% 37%"
      },
      des: {
        bg: "172 46% 82%",
        bgHover: "172 46% 76%",
        bgDark: "172 70% 64%",
        text: "172 70% 22%",
        textAlt: "172 70% 36%",
        textDark: "172 80% 74%",
        textAltDark: "172 76% 62%",
        border: "172 70% 38%"
      },
      prj: {
        bg: "78 70% 82%",
        bgHover: "78 70% 76%",
        bgDark: "78 86% 60%",
        text: "78 86% 18%",
        textAlt: "78 86% 32%",
        textDark: "78 94% 70%",
        textAltDark: "78 90% 58%",
        border: "78 86% 34%"
      }
    }
  },
  blueprint: {
    label: "Blueprint",
    description: "Studio-board blues with warm project contrast.",
    opacity: "0.25",
    opacityHover: "0.33",
    colors: {
      lec: {
        bg: "190 74% 86%",
        bgHover: "190 74% 80%",
        bgDark: "190 74% 69%",
        text: "190 76% 28%",
        textAlt: "190 76% 42%",
        textDark: "190 76% 73%",
        textAltDark: "190 72% 61%",
        border: "190 76% 44%"
      },
      lab: {
        bg: "205 76% 86%",
        bgHover: "205 76% 80%",
        bgDark: "205 76% 70%",
        text: "205 78% 30%",
        textAlt: "205 78% 45%",
        textDark: "205 78% 74%",
        textAltDark: "205 74% 62%",
        border: "205 78% 47%"
      },
      sem: {
        bg: "220 78% 86%",
        bgHover: "220 78% 80%",
        bgDark: "220 78% 72%",
        text: "220 80% 34%",
        textAlt: "220 80% 52%",
        textDark: "220 80% 76%",
        textAltDark: "220 76% 64%",
        border: "220 80% 54%"
      },
      tut: {
        bg: "236 74% 86%",
        bgHover: "236 74% 80%",
        bgDark: "236 74% 74%",
        text: "236 76% 36%",
        textAlt: "236 76% 58%",
        textDark: "236 76% 78%",
        textAltDark: "236 72% 66%",
        border: "236 76% 60%"
      },
      des: {
        bg: "260 70% 88%",
        bgHover: "260 70% 82%",
        bgDark: "260 70% 76%",
        text: "260 72% 38%",
        textAlt: "260 72% 62%",
        textDark: "260 72% 80%",
        textAltDark: "260 68% 68%",
        border: "260 72% 64%"
      },
      prj: {
        bg: "30 88% 86%",
        bgHover: "30 88% 80%",
        bgDark: "30 88% 70%",
        text: "30 90% 30%",
        textAlt: "30 90% 50%",
        textDark: "30 90% 74%",
        textAltDark: "30 86% 62%",
        border: "30 90% 52%"
      }
    }
  }
} as const satisfies Record<string, TimetablePalette>

export const APPEARANCE_DENSITIES = {
  compact: {
    label: "Compact",
    cellPadding: "0.25rem",
    tablePadding: "0.25rem"
  },
  comfortable: {
    label: "Comfortable",
    cellPadding: "0.5rem",
    tablePadding: "0.25rem"
  },
  spacious: {
    label: "Spacious",
    cellPadding: "0.75rem",
    tablePadding: "0.375rem"
  }
} as const

export const CONTRAST_PRESETS = {
  normal: {
    label: "Normal",
    mutedForeground: "215.4 16.3% 46.9%",
    mutedForegroundDark: "215 20.2% 65.1%"
  },
  high: {
    label: "High",
    mutedForeground: "222.2 47.4% 24%",
    mutedForegroundDark: "210 40% 82%"
  }
} as const

export type TimetableStylePreset = keyof typeof TIMETABLE_STYLE_PRESETS
export type AppearanceDensity = keyof typeof APPEARANCE_DENSITIES
export type ContrastPreset = keyof typeof CONTRAST_PRESETS

export interface AppearanceSettings {
  radius: number
  density: AppearanceDensity
  contrast: ContrastPreset
  timetableStyle: TimetableStylePreset
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  radius: 8,
  density: "comfortable",
  contrast: "normal",
  timetableStyle: "classic"
}
