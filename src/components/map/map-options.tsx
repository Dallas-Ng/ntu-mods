"use client"

import {
  EyeOff,
  Layers,
  Layers2,
  Map as MapIcon,
  RotateCcw,
  Satellite
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  CATEGORIES,
  HYBRID_TONES,
  type HybridTone,
  type LandmarkCat
} from "@/lib/venue-map"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { FLOATING } from "@/components/map/campus-map"
import { PlaceIcon } from "@/components/map/category-icons"

export type MapStyle = "standard" | "satellite" | "hybrid"

interface Props {
  mapStyle: MapStyle
  onMapStyle: (s: MapStyle) => void
  hybridTone: HybridTone
  onHybridTone: (t: HybridTone) => void
  cats: Set<LandmarkCat>
  onCats: (next: Set<LandmarkCat>) => void
  buildingLabels: boolean
  onBuildingLabels: (v: boolean) => void
  roomLabels: boolean
  onRoomLabels: (v: boolean) => void
  onTurnOffAll: () => void
  onReset: () => void
}

const Row = ({
  label,
  hint,
  icon,
  checked,
  onChange
}: {
  label: string
  hint?: string
  icon?: string
  checked: boolean
  onChange: (v: boolean) => void
}) => (
  <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5 text-sm">
    <span className="flex min-w-0 items-center gap-2">
      {icon && (
        <PlaceIcon
          name={icon}
          className="text-muted-foreground size-4 shrink-0"
        />
      )}
      <span className="min-w-0">
        {label}
        {hint && (
          <span className="text-muted-foreground block text-xs">{hint}</span>
        )}
      </span>
    </span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </label>
)

const STYLES: { key: MapStyle; label: string; icon: typeof MapIcon }[] = [
  { key: "standard", label: "Standard", icon: MapIcon },
  { key: "hybrid", label: "Hybrid", icon: Layers2 },
  { key: "satellite", label: "Satellite", icon: Satellite }
]

/** Map type, what to label and a way back to the defaults. */
const MapOptions = ({
  mapStyle,
  onMapStyle,
  hybridTone,
  onHybridTone,
  cats,
  onCats,
  buildingLabels,
  onBuildingLabels,
  roomLabels,
  onRoomLabels,
  onTurnOffAll,
  onReset
}: Props) => {
  const anyLabels = cats.size > 0 || buildingLabels || roomLabels
  const toggle = (c: LandmarkCat, on: boolean) => {
    const next = new Set(cats)
    if (on) next.add(c)
    else next.delete(c)
    onCats(next)
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            FLOATING,
            "flex h-11 w-[84px] cursor-pointer items-center justify-center gap-2 px-3 text-sm font-semibold transition-transform duration-150 ease-out active:scale-[0.97]"
          )}>
          <Layers className="size-4" /> Map
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[75vh] w-72 overflow-y-auto rounded-xl p-3">
        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
          Map type
        </p>
        <div className="grid grid-cols-3 gap-2">
          {STYLES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={mapStyle === key}
              onClick={() => {
                // Tapping Hybrid again flips the building colour.
                if (key === "hybrid" && mapStyle === "hybrid")
                  onHybridTone(
                    HYBRID_TONES[
                      (HYBRID_TONES.findIndex((t) => t.key === hybridTone) +
                        1) %
                        HYBRID_TONES.length
                    ].key
                  )
                else onMapStyle(key)
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-2.5 text-sm font-medium transition-[transform,background-color] duration-150 ease-out active:scale-[0.97]",
                mapStyle === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent"
              )}>
              <Icon className="size-5" />
              {label}
              {key === "hybrid" && mapStyle === "hybrid" && (
                <span className="-mt-1 text-[10px] leading-none font-normal capitalize">
                  {HYBRID_TONES.find((t) => t.key === hybridTone)?.label}
                </span>
              )}
            </button>
          ))}
        </div>
        {mapStyle === "hybrid" && (
          <div className="mt-3">
            <div className="flex justify-center gap-3">
              {HYBRID_TONES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  aria-label={t.label}
                  aria-pressed={hybridTone === t.key}
                  title={t.label}
                  onClick={() => onHybridTone(t.key)}
                  style={{ background: t.swatch }}
                  className={cn(
                    "size-7 cursor-pointer rounded-full border-2 transition-transform duration-150 ease-out active:scale-[0.92]",
                    hybridTone === t.key
                      ? "border-primary ring-primary/30 ring-2"
                      : "border-border"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        <p className="text-muted-foreground mt-4 mb-1 text-xs font-medium tracking-wide uppercase">
          Buildings
        </p>
        <Row
          label="Teaching buildings"
          hint="Spines, schools and blocks with classes"
          checked={buildingLabels}
          onChange={onBuildingLabels}
        />
        <Row
          label="Room numbers"
          hint="When zoomed in on a level"
          checked={roomLabels}
          onChange={onRoomLabels}
        />
        <p className="text-muted-foreground mt-3 mb-1 text-xs font-medium tracking-wide uppercase">
          Places
        </p>
        {(Object.keys(CATEGORIES) as LandmarkCat[]).map((c) => (
          <Row
            key={c}
            label={CATEGORIES[c].label}
            icon={c}
            checked={cats.has(c)}
            onChange={(on) => toggle(c, on)}
          />
        ))}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!anyLabels}
            onClick={onTurnOffAll}>
            <EyeOff /> Turn off all
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw /> Reset
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default MapOptions
