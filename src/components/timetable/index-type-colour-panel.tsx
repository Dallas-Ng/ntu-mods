"use client"

import { RotateCcw } from "lucide-react"

import {
  INDEX_TYPE_LABELS,
  type AppearanceSettings,
  type IndexTypeColorKey,
  type IndexTypeStyleOverride
} from "@/config/appearance-settings"
import { clampOpacity, getPaletteHex } from "@/lib/index-type-colors"

import { Button } from "../ui/button"
import { Input } from "../ui/input"

// The native picker's swatch has its own padding and border in WebKit, so it
// is reset here to sit flush inside the rounded control.
const COLOR_INPUT_CLASS =
  "size-8 shrink-0 cursor-pointer appearance-none rounded-md border border-input bg-transparent p-0 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring [&::-moz-color-swatch]:rounded-[5px] [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-[5px] [&::-webkit-color-swatch]:border-0"

interface Props {
  type: IndexTypeColorKey
  appearance: AppearanceSettings
  /**
   * The override this level owns. Edits start from it, and it also decides
   * whether "Use default" has anything to clear.
   */
  override?: IndexTypeStyleOverride
  /**
   * What the blocks show right now, when a type override sits underneath a
   * module's. Defaults to `override`.
   */
  effective?: IndexTypeStyleOverride
  onChange: (next: IndexTypeStyleOverride | undefined) => void
  /** Set when the panel edits one module rather than the class type. */
  moduleKey?: string
  /** One tight row (label, colour, opacity, reset) for lists of types. */
  inline?: boolean
}

/**
 * One class type's colour: a real colour picker, opacity, and the way back to
 * the palette. The picked colour's hue and saturation retint the palette's
 * lightness ramp, so the type keeps the contrast the palette was built for.
 */
const IndexTypeColourPanel = ({
  type,
  appearance,
  override,
  effective,
  onChange,
  moduleKey,
  inline = false
}: Props) => {
  const view = effective ?? override
  const paletteHex = getPaletteHex(appearance.timetableStyle, type)
  const color = view?.color ?? paletteHex
  const opacity = clampOpacity(view?.opacity ?? 100)
  const label = INDEX_TYPE_LABELS[type]

  const write = (patch: { color?: string | null; opacity?: number | null }) => {
    const next: IndexTypeStyleOverride = { ...override }

    if ("color" in patch) {
      if (patch.color == null) delete next.color
      else next.color = patch.color
    }

    if ("opacity" in patch) {
      if (patch.opacity == null || patch.opacity >= 100) delete next.opacity
      else next.opacity = clampOpacity(patch.opacity)
    }

    onChange(next.color == null && next.opacity == null ? undefined : next)
  }

  if (inline)
    return (
      <div className="flex items-center gap-2">
        <span className="w-8 shrink-0 text-xs font-semibold">{label}</span>

        <input
          type="color"
          aria-label={`${label} colour`}
          value={color}
          onChange={(event) => write({ color: event.target.value })}
          className={COLOR_INPUT_CLASS}
        />

        <Input
          type="range"
          aria-label={`${label} opacity`}
          min={0}
          max={100}
          step={1}
          value={opacity}
          onChange={(event) => write({ opacity: Number(event.target.value) })}
          className="accent-primary h-7 min-w-0 flex-1 cursor-pointer border-0 bg-transparent px-0 shadow-none"
        />

        <span className="w-9 shrink-0 text-right text-xs tabular-nums">
          {opacity}%
        </span>

        <Button
          variant="ghost"
          size="icon"
          disabled={!override}
          onClick={() => onChange(undefined)}
          aria-label={`${label} back to default`}
          title="Back to the default for this type"
          className="size-7 shrink-0">
          <RotateCcw className="size-3" />
        </Button>
      </div>
    )

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">
        {moduleKey ? label : `${label} colour`}
      </p>

      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} colour`}
          value={color}
          onChange={(event) => write({ color: event.target.value })}
          className={COLOR_INPUT_CLASS}
        />

        <span className="text-muted-foreground text-xs uppercase tabular-nums">
          {view?.color ?? "Palette"}
        </span>

        <Button
          variant="ghost"
          size="sm"
          disabled={!override}
          onClick={() => onChange(undefined)}
          title="Back to the palette for this type"
          className="ml-auto h-7 gap-1.5 px-2 text-xs">
          <RotateCcw className="size-3" />
          Use default
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Opacity</span>

        <Input
          type="range"
          aria-label={`${label} opacity`}
          min={0}
          max={100}
          step={1}
          value={opacity}
          onChange={(event) => write({ opacity: Number(event.target.value) })}
          className="accent-primary h-8 flex-1 cursor-pointer border-0 bg-transparent px-0 shadow-none"
        />

        <span className="w-9 text-right text-xs tabular-nums">{opacity}%</span>
      </div>
    </div>
  )
}

export default IndexTypeColourPanel
