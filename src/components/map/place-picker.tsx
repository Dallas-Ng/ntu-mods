"use client"

import { useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { searchPlaces } from "@/lib/place-search"
import { cn } from "@/lib/utils"
import {
  CATEGORIES,
  CATEGORY_ALIASES,
  levelLabel,
  ringsBounds,
  type LandmarkCat,
  type Place,
  type VenueData
} from "@/lib/venue-map"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

export interface PickerPlace extends Place {
  id: string
  name: string
  sub: string
  x: number
  y: number
  kind: "venue" | "landmark" | "building"
  /** Landmark category, for browsing. */
  cat?: LandmarkCat
  /** Words beyond its name that should find it. */
  alias?: string
  /** Busier places rank higher in search. */
  weight?: number
  /** Building the place is in (or is). */
  b?: number | null
  /** Building outline bounds, to frame a whole building. */
  bounds?: [number, number, number, number]
}

const SEARCHABLE: LandmarkCat[] = [
  "hall",
  "food",
  "transport",
  "study",
  "sports",
  "exam",
  "services",
  "parking",
  "toilet"
]

/** Every place a student might search for: class venues, landmarks, then buildings. */
export const buildPlaces = (data: VenueData): PickerPlace[] => {
  const { origin } = data
  const lonLat = (x: number, y: number) => ({
    lon: origin.lon0 + x / origin.mPerLon,
    lat: origin.lat1 - y / origin.mPerLat
  })
  const out: PickerPlace[] = Object.entries(data.venues).map(([key, v]) => ({
    id: `v:${key}`,
    kind: "venue",
    name: key,
    sub: [v.name, v.z !== 0 && levelLabel(data, v.z)]
      .filter(Boolean)
      .join(" · "),
    lon: v.lon,
    lat: v.lat,
    z: v.z,
    x: v.x,
    y: v.y,
    b: v.b,
    weight: v.slots
  }))
  for (const l of data.landmarks) {
    if (!SEARCHABLE.includes(l.c)) continue
    out.push({
      id: `l:${l.id}`,
      kind: "landmark",
      cat: l.c,
      name: l.n,
      sub: [
        CATEGORIES[l.c].label,
        l.z === 0 ? "Outdoors" : levelLabel(data, l.z)
      ].join(" · "),
      alias: CATEGORY_ALIASES[l.c],
      ...lonLat(l.x, l.y),
      z: l.z,
      x: l.x,
      y: l.y,
      b: l.b
    })
  }
  for (const b of data.buildings) {
    const [x0, y0, x1, y1] = ringsBounds(b.rings)
    const x = (x0 + x1) / 2
    const y = (y0 + y1) / 2
    out.push({
      id: `b:${b.id}`,
      kind: "building",
      name: b.name,
      sub:
        b.levels.length > 1
          ? `Building · ${b.levels.length} levels`
          : "Building",
      ...lonLat(x, y),
      z: 0,
      x,
      y,
      b: b.id,
      bounds: [x0, y0, x1, y1]
    })
  }
  return out
}

interface Props {
  label: string
  places: PickerPlace[]
  value: string | null
  onChange: (id: string) => void
}

const PlacePicker = ({ label, places, value, onChange }: Props) => {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const dq = useDebounce(q, 120)
  // Until something is typed, offer the busiest rooms.
  const shown = useMemo(
    () =>
      dq.trim()
        ? searchPlaces(places, dq, 40)
        : places
            .filter((p) => p.kind === "venue")
            .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
            .slice(0, 12),
    [places, dq]
  )
  const current = useMemo(
    () => places.find((p) => p.id === value),
    [places, value]
  )

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setQ("")
      }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto min-h-9 w-full justify-between py-1.5 text-left font-normal">
          <span className="min-w-0">
            <span className="text-muted-foreground block text-[11px] leading-none">
              {label}
            </span>
            <span className="block truncate">
              {current ? current.name : "Search a venue or place"}
            </span>
          </span>
          <ChevronsUpDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0"
        align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={q}
            onValueChange={setQ}
            placeholder="LT1, North Spine, Hall 2, gym..."
          />
          <CommandList>
            <CommandEmpty>No matching place.</CommandEmpty>
            <CommandGroup>
              {shown.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.id}
                  onSelect={() => {
                    onChange(p.id)
                    setOpen(false)
                  }}>
                  <Check
                    className={cn(
                      "size-4",
                      value === p.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{p.name}</span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {p.sub}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default PlacePicker
