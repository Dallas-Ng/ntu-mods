import {
  CloudMoon,
  Coffee,
  type LucideIcon,
  Moon,
  Stars,
  Sun,
  TreePine
} from "lucide-react"

export const THEME_META = {
  light: { label: "Light", icon: Sun },
  paper: { label: "Paper", icon: Coffee },
  forest: { label: "Forest", icon: TreePine },
  dark: { label: "Dark", icon: Moon },
  dim: { label: "Dim", icon: CloudMoon },
  midnight: { label: "Midnight", icon: Stars }
} satisfies Record<string, { label: string; icon: LucideIcon }>

export const THEME_ORDER = Object.keys(THEME_META) as ThemeName[]

export type ThemeName = keyof typeof THEME_META
