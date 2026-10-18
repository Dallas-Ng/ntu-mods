"use client"

import { Check, RotateCcw } from "lucide-react"
import posthog from "posthog-js"

import {
  APPEARANCE_DENSITIES,
  CONTRAST_PRESETS,
  DEFAULT_APPEARANCE_SETTINGS,
  INDEX_TYPE_COLOR_KEYS,
  TIMETABLE_STYLE_PRESETS
} from "@/config/appearance-settings"
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

const GroupLabel = ({
  title,
  desc,
  aside
}: {
  title: string
  desc: string
  aside?: React.ReactNode
}) => (
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0 space-y-1">
      <p className="text-sm leading-none font-semibold">{title}</p>
      <p className="text-muted-foreground text-sm text-pretty">{desc}</p>
    </div>

    {aside}
  </div>
)

const TOGGLE_GROUP_CLASS = "bg-background mt-auto w-full gap-1 rounded-xl p-1"
const TOGGLE_ITEM_CLASS =
  "h-9 flex-1 rounded-lg px-2 whitespace-nowrap data-[state=on]:bg-muted data-[state=on]:text-foreground"

const AppearanceSettings = () => {
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
    <div className="space-y-8">
      <div className="bg-background space-y-3 rounded-xl p-4">
        <div className="flex h-9 items-center justify-between gap-2">
          <p className="text-sm font-semibold">Preview</p>
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

        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
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

      <section className="space-y-3">
        <GroupLabel
          title="Radius"
          desc="Controls the roundness of buttons, cards, inputs, and cells."
          aside={
            <span className="bg-background rounded-md px-2 py-1 text-xs whitespace-nowrap tabular-nums">
              {appearance.radius}px
            </span>
          }
        />

        <Input
          type="range"
          aria-label="Corner radius"
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
          className="h-9 border-0 bg-transparent px-0 shadow-none"
        />
      </section>

      <div className="grid gap-8 sm:grid-cols-2">
        <section className="flex flex-col gap-3">
          <GroupLabel
            title="Density"
            desc="Adjusts timetable and table spacing."
          />

          <ToggleGroup
            type="single"
            value={appearance.density}
            onValueChange={(v) => {
              if (!v) return
              updateAppearance({
                density: v as keyof typeof APPEARANCE_DENSITIES
              })
              posthog.capture("settings_appearance_changed", {
                setting: "density",
                value: v
              })
            }}
            className={TOGGLE_GROUP_CLASS}>
            {Object.entries(APPEARANCE_DENSITIES).map(([key, value]) => (
              <ToggleGroupItem
                key={key}
                value={key}
                className={TOGGLE_ITEM_CLASS}>
                {value.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>

        <section className="flex flex-col gap-3">
          <GroupLabel
            title="Contrast"
            desc="Lifts secondary text when you want a crisper interface."
          />

          <ToggleGroup
            type="single"
            value={appearance.contrast}
            onValueChange={(v) => {
              if (!v) return
              updateAppearance({
                contrast: v as keyof typeof CONTRAST_PRESETS
              })
              posthog.capture("settings_appearance_changed", {
                setting: "contrast",
                value: v
              })
            }}
            className={TOGGLE_GROUP_CLASS}>
            {Object.entries(CONTRAST_PRESETS).map(([key, value]) => (
              <ToggleGroupItem
                key={key}
                value={key}
                className={TOGGLE_ITEM_CLASS}>
                {value.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>
      </div>

      <section className="space-y-3">
        <GroupLabel
          title="Timetable colours"
          desc="Pick a palette. LEC, LAB, SEM, TUT, DES, and PRJ stay mapped."
        />

        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(TIMETABLE_STYLE_PRESETS).map(([key, value]) => {
            const selected = appearance.timetableStyle === key

            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  updateAppearance({
                    timetableStyle: key as keyof typeof TIMETABLE_STYLE_PRESETS
                  })
                  posthog.capture("settings_timetable_style_changed", {
                    preset_name: key
                  })
                }}
                className={cn(
                  "bg-background hover:bg-accent flex min-h-28 flex-col gap-3 rounded-xl p-4 text-left ring-2 transition-colors",
                  selected ? "ring-foreground" : "ring-transparent"
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
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm leading-none font-semibold">
                      {value.label}
                    </p>
                    <p className="text-muted-foreground text-sm text-pretty">
                      {value.description}
                    </p>
                  </div>

                  {selected && <Check className="ml-auto size-4 shrink-0" />}
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export const AppearanceSettingsLoading = () => {
  return (
    <div className="space-y-8">
      <div className="bg-background h-60 rounded-xl sm:h-44" />
    </div>
  )
}

export default AppearanceSettings
