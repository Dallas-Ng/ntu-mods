"use client"

import { Check, RotateCcw } from "lucide-react"
import { useTheme } from "next-themes"
import posthog from "posthog-js"

import {
  APPEARANCE_DENSITIES,
  CONTRAST_PRESETS,
  DEFAULT_APPEARANCE_SETTINGS,
  INDEX_TYPE_COLOR_KEYS,
  TIMETABLE_STYLE_PRESETS
} from "@/config/appearance-settings"
import { THEME_META, THEME_ORDER } from "@/lib/theme-cycle"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"

interface IconProps {
  label?: boolean
}

const TIMETABLE_PREVIEW_TYPES = [
  {
    label: "LEC",
    background:
      "bg-[hsl(var(--index-lec-bg))] dark:bg-[hsl(var(--index-lec-bg-dark)/var(--index-bg-opacity-dark))]",
    text: "text-[hsl(var(--index-lec-text))] dark:text-[hsl(var(--index-lec-text-dark))]"
  },
  {
    label: "LAB",
    background:
      "bg-[hsl(var(--index-lab-bg))] dark:bg-[hsl(var(--index-lab-bg-dark)/var(--index-bg-opacity-dark))]",
    text: "text-[hsl(var(--index-lab-text))] dark:text-[hsl(var(--index-lab-text-dark))]"
  },
  {
    label: "SEM",
    background:
      "bg-[hsl(var(--index-sem-bg))] dark:bg-[hsl(var(--index-sem-bg-dark)/var(--index-bg-opacity-dark))]",
    text: "text-[hsl(var(--index-sem-text))] dark:text-[hsl(var(--index-sem-text-dark))]"
  },
  {
    label: "TUT",
    background:
      "bg-[hsl(var(--index-tut-bg))] dark:bg-[hsl(var(--index-tut-bg-dark)/var(--index-bg-opacity-dark))]",
    text: "text-[hsl(var(--index-tut-text))] dark:text-[hsl(var(--index-tut-text-dark))]"
  },
  {
    label: "DES",
    background:
      "bg-[hsl(var(--index-des-bg))] dark:bg-[hsl(var(--index-des-bg-dark)/var(--index-bg-opacity-dark))]",
    text: "text-[hsl(var(--index-des-text))] dark:text-[hsl(var(--index-des-text-dark))]"
  },
  {
    label: "PRJ",
    background:
      "bg-[hsl(var(--index-prj-bg))] dark:bg-[hsl(var(--index-prj-bg-dark)/var(--index-bg-opacity-dark))]",
    text: "text-[hsl(var(--index-prj-text))] dark:text-[hsl(var(--index-prj-text-dark))]"
  }
] as const

export const LightThemeIcon = (props: IconProps) => {
  return (
    <div className="w-full">
      <div className="items-center rounded-md p-1">
        <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
          <div className="hidden space-y-2 rounded-md bg-white p-2 shadow-sm md:block">
            <div className="h-2 w-[30%] rounded-lg bg-[#ecedef]" />
            <div className="h-2 w-[50%] rounded-lg bg-[#ecedef]" />
          </div>

          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
            <div className="size-4 rounded-full bg-[#ecedef]" />
            <div className="h-2 flex-1 rounded-lg bg-[#ecedef]" />
          </div>

          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
            <div className="size-4 rounded-full bg-[#ecedef]" />
            <div className="h-2 flex-1 rounded-lg bg-[#ecedef]" />
          </div>
        </div>
      </div>

      {props.label && (
        <span className="block w-full p-2 text-center text-sm">Light</span>
      )}
    </div>
  )
}

export const DarkThemeIcon = (props: IconProps) => {
  return (
    <div className="dark w-full">
      <div className="bg-popover items-center rounded-md p-1">
        <div className="space-y-2 rounded-sm bg-slate-900 p-2">
          <div className="hidden space-y-2 rounded-md bg-slate-800 p-2 shadow-sm md:block">
            <div className="h-2 w-[30%] rounded-lg bg-slate-400" />
            <div className="h-2 w-[50%] rounded-lg bg-slate-400" />
          </div>

          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
            <div className="size-4 rounded-full bg-slate-400" />
            <div className="h-2 flex-1 rounded-lg bg-slate-400" />
          </div>

          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
            <div className="size-4 rounded-full bg-slate-400" />
            <div className="h-2 flex-1 rounded-lg bg-slate-400" />
          </div>
        </div>
      </div>

      {props.label && (
        <span className="block w-full p-2 text-center text-sm">Dark</span>
      )}
    </div>
  )
}

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()
  const appearance = {
    ...DEFAULT_APPEARANCE_SETTINGS,
    ...settings.appearance
  }

  const updateAppearance = (next: Partial<typeof appearance>) => {
    updateSettings({
      appearance: {
        ...appearance,
        ...next
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="bg-background mx-auto w-full max-w-sm space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Preview</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              updateSettings({ appearance: DEFAULT_APPEARANCE_SETTINGS })
              posthog.capture("settings_reset")
            }}
            aria-label="Reset appearance">
            <RotateCcw className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {TIMETABLE_PREVIEW_TYPES.map((type) => (
            <div
              key={type.label}
              className={cn(
                "rounded-md p-[var(--cell-padding)]",
                type.background
              )}>
              <p className={cn("font-bold", type.text)}>{type.label}</p>
              <p className="text-muted-foreground">Index 00000</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <section className="space-y-3">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-muted-foreground text-xs">
              Pick the palette that&apos;s easiest on your eyes.
            </p>
          </div>

          <ToggleGroup
            type="single"
            value={theme}
            onValueChange={(v) => {
              if (!v) return
              setTheme(v)
              posthog.capture("settings_theme_changed", { theme: v })
            }}
            className="grid grid-cols-3">
            {THEME_ORDER.map((key) => {
              const Icon = THEME_META[key].icon
              return (
                <ToggleGroupItem key={key} value={key} className="gap-1.5">
                  <Icon className="size-4" />
                  {THEME_META[key].label}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Radius</p>
              <p className="text-muted-foreground text-xs">
                Controls the roundness of buttons, cards, inputs, and cells.
              </p>
            </div>

            <span className="text-muted-foreground rounded-md border px-2 py-1 text-xs">
              {appearance.radius}px
            </span>
          </div>

          <Input
            type="range"
            min={0}
            max={16}
            step={1}
            value={appearance.radius}
            onChange={(event) =>
              updateAppearance({ radius: Number(event.target.value) })
            }
            onMouseUp={(event) =>
              posthog.capture("settings_appearance_changed", {
                setting: "radius",
                value: Number((event.target as HTMLInputElement).value)
              })
            }
            className="h-9 px-0 shadow-none"
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Density</p>
              <p className="text-muted-foreground text-xs">
                Adjusts timetable and table spacing.
              </p>
            </div>

            <ToggleGroup
              type="single"
              value={appearance.density}
              onValueChange={(v) => {
                if (!v) return
                updateAppearance({ density: v as keyof typeof APPEARANCE_DENSITIES })
                posthog.capture("settings_appearance_changed", {
                  setting: "density",
                  value: v
                })
              }}
              className="grid grid-cols-3">
              {Object.entries(APPEARANCE_DENSITIES).map(([key, value]) => (
                <ToggleGroupItem key={key} value={key} className="px-1 text-xs">
                  {value.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Contrast</p>
              <p className="text-muted-foreground text-xs">
                Lifts secondary text when you want a crisper interface.
              </p>
            </div>

            <ToggleGroup
              type="single"
              value={appearance.contrast}
              onValueChange={(v) => {
                if (!v) return
                updateAppearance({ contrast: v as keyof typeof CONTRAST_PRESETS })
                posthog.capture("settings_appearance_changed", {
                  setting: "contrast",
                  value: v
                })
              }}
              className="grid grid-cols-2">
              {Object.entries(CONTRAST_PRESETS).map(([key, value]) => (
                <ToggleGroupItem key={key} value={key}>
                  {value.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-sm font-medium">Timetable colours</p>
            <p className="text-muted-foreground text-xs">
              Pick a hardcoded palette; LEC, LAB, SEM, TUT, DES, and PRJ stay
              mapped.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(TIMETABLE_STYLE_PRESETS).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  updateAppearance({
                    timetableStyle: key as keyof typeof TIMETABLE_STYLE_PRESETS
                  })
                  posthog.capture("settings_timetable_style_changed", {
                    preset_name: key
                  })
                }}
                className={cn(
                  "hover:bg-accent space-y-2 rounded-md border p-3 text-left transition-colors",
                  appearance.timetableStyle === key && "border-primary"
                )}>
                <div className="flex gap-1">
                  {INDEX_TYPE_COLOR_KEYS.map((type) => (
                    <span
                      key={type}
                      className="h-2 flex-1 rounded-full"
                      style={{
                        backgroundColor: `hsl(${value.colors[type].bg})`
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{value.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {value.description}
                    </p>
                  </div>
                  {appearance.timetableStyle === key && (
                    <Check className="text-primary ml-auto size-4 shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export const AppearanceSettingsLoading = () => {
  return (
    <div className="space-y-5">
      <div className="bg-background mx-auto w-full max-w-sm space-y-3 rounded-md border p-3 opacity-60">
        <div className="flex items-center justify-between gap-2">
          <div className="bg-muted h-4 w-16 rounded" />
          <div className="bg-muted size-9 rounded-md" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="bg-muted space-y-2 rounded-md p-2">
              <div className="bg-background h-3 w-10 rounded" />
              <div className="bg-background h-2 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5 opacity-60">
        <div className="space-y-3">
          <div className="bg-muted h-4 w-20 rounded" />
          <div className="bg-muted h-9 rounded-md" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="bg-muted h-4 w-20 rounded" />
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="bg-muted h-9 rounded-md" />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-muted h-4 w-20 rounded" />
            <div className="grid grid-cols-2 gap-1">
              {Array.from({ length: 2 }, (_, index) => (
                <div key={index} className="bg-muted h-9 rounded-md" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-muted h-4 w-32 rounded" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="bg-muted h-24 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppearanceSettings
