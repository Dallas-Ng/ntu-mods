"use client"

// A student's day on the map: classes in order, the walk between each pair
// and whether it fits the gap. Used by the timetable page's "Walking between
// classes" panel.
import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Footprints } from "lucide-react"

import {
  CUSTOM_LUNCH_TYPE,
  PRESET_INDEX_TYPES
} from "@/lib/custom-course-colors"
import { getIndexType } from "@/lib/get-index-type"
import { cn } from "@/lib/utils"
import {
  dayStops,
  estimateWalk,
  fetchWalk,
  fmtMin,
  legStatus,
  levelLabel,
  type LegStatus,
  type Stop,
  type VenueData,
  type WalkResult
} from "@/lib/venue-map"
import type { Pin, RouteLayer } from "@/components/map/campus-map"

export interface Leg {
  walk: WalkResult
  estimated: boolean
  gap: number
  walkMin: number
  status: LegStatus
}

/** Past this gap nobody is rushing, so the walk is not looked up. */
export const MAX_GAP = 90

export const typeColour = (type: string) =>
  `hsl(var(--index-${getIndexType(type).toLowerCase()}-border))`

/** Custom blocks keep the colour they have on the grid. */
const stopColour = (s: Stop) =>
  !s.custom
    ? typeColour(s.type)
    : s.typeLabel === CUSTOM_LUNCH_TYPE
      ? "hsl(var(--index-lunch-border))"
      : PRESET_INDEX_TYPES.has(s.typeLabel)
        ? typeColour(s.typeLabel)
        : "hsl(var(--index-cus-border))"

const statusText: Record<LegStatus, string> = {
  ok: "text-muted-foreground",
  close:
    "text-[hsl(var(--index-sem-text))] dark:text-[hsl(var(--index-sem-text-dark))]",
  tight: "text-destructive"
}

export const useDayRoute = (
  data: VenueData | null,
  timetable: TimetableWithIndex,
  day: number,
  selected?: string
) => {
  const [legs, setLegs] = useState<Record<string, Leg>>({})
  const stops = useMemo(
    () => (data ? dayStops(timetable, day, data.venues) : []),
    [data, timetable, day]
  )

  // Walking legs between consecutive classes at different places, one at a
  // time so a cold day stays well under the route rate limit.
  useEffect(() => {
    if (!data) return
    let live = true
    ;(async () => {
      for (let i = 1; i < stops.length; i++) {
        const a = stops[i - 1]
        const b = stops[i]
        if (!a.venue || !b.venue || a.venueKey === b.venueKey) continue
        const gap = b.start - a.end
        if (gap < 0 || gap > MAX_GAP) continue
        const walk = await fetchWalk(a.venue, b.venue)
        if (!live) return
        const w = walk ?? estimateWalk(a.venue, b.venue)
        const walkMin = Math.max(1, Math.ceil(w.seconds / 60))
        setLegs((prev) => ({
          ...prev,
          [`${a.id}>${b.id}`]: {
            walk: w,
            estimated: !walk,
            gap,
            walkMin,
            status: legStatus(gap, walkMin)
          }
        }))
      }
    })()
    return () => {
      live = false
    }
  }, [data, stops])

  // Classes that overlap in time (stops are sorted by start), with who
  // they overlap with. Back-to-back (end == start) is not a clash.
  const clashes = useMemo(() => {
    const withCodes = new Map<string, string[]>()
    let pairs = 0
    stops.forEach((b, i) => {
      for (let j = 0; j < i; j++) {
        const a = stops[j]
        if (a.end <= b.start) continue
        pairs++
        withCodes.set(a.id, [
          ...(withCodes.get(a.id) ?? []),
          `${b.code} ${b.typeLabel}`.trim()
        ])
        withCodes.set(b.id, [
          ...(withCodes.get(b.id) ?? []),
          `${a.code} ${a.typeLabel}`.trim()
        ])
      }
    })
    return { withCodes, pairs }
  }, [stops])

  const pins: Pin[] = useMemo(() => {
    const byVenue = new Map<string, Pin>()
    stops.forEach((s, i) => {
      const v = s.venue
      if (!v) return
      const clash = clashes.withCodes.has(s.id)
      const pin = byVenue.get(s.venueKey)
      if (pin) {
        pin.numbers.push(i + 1)
        if (clash) {
          pin.clash = true
          pin.colour = "hsl(var(--destructive))"
        }
      } else
        byVenue.set(s.venueKey, {
          id: s.id,
          x: v.x,
          y: v.y,
          z: v.z,
          label: s.venueKey,
          numbers: [i + 1],
          colour: clash ? "hsl(var(--destructive))" : stopColour(s),
          clash,
          approx: v.how === "fuzzy",
          building: v.b
        })
    })
    return [...byVenue.values()]
  }, [stops, clashes])

  const routes: RouteLayer[] = useMemo(() => {
    const selIdx = stops.findIndex((s) => s.id === selected)
    return stops.slice(1).flatMap((b, i) => {
      const id = `${stops[i].id}>${b.id}`
      const leg = legs[id]
      return leg
        ? [
            {
              id,
              walk: leg.walk,
              status: leg.status,
              active: selIdx === i || selIdx === i + 1
            }
          ]
        : []
    })
  }, [stops, legs, selected])

  const summary = useMemo(() => {
    const all = stops
      .slice(1)
      .map((b, i) => legs[`${stops[i].id}>${b.id}`])
      .filter(Boolean)
    return {
      metres: all.reduce((n, l) => n + l.walk.metres, 0),
      clashes: clashes.pairs,
      tight: all.filter((l) => l.status === "tight").length,
      close: all.filter((l) => l.status === "close").length
    }
  }, [stops, legs, clashes])

  return { stops, legs, pins, routes, summary, clashes: clashes.withCodes }
}

export const StopRow = ({
  data,
  stop,
  n,
  selected,
  clashWith,
  onClick
}: {
  data: VenueData
  stop: Stop
  /** The number this stop has on the map. */
  n: number
  selected: boolean
  /** Other classes this one overlaps in time. */
  clashWith?: string[]
  onClick: () => void
}) => {
  const v = stop.venue
  const place = [
    stop.venueKey || "No venue",
    v && v.z !== 0 ? levelLabel(data, v.z) : null,
    !v && stop.venueKey && stop.venueKey !== "ONLINE" ? "not on the map" : null,
    v?.how === "fuzzy" ? "approximate" : null
  ]
    .filter(Boolean)
    .join(" · ")
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hover:bg-accent flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
        clashWith && "bg-destructive/10 hover:bg-destructive/15",
        selected && "bg-accent"
      )}>
      {/* Same number and ring colour as the pin on the map. */}
      <span
        className={cn(
          "bg-background flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold tabular-nums",
          clashWith && "bg-destructive text-white"
        )}
        style={{
          borderColor: clashWith ? "hsl(var(--destructive))" : stopColour(stop)
        }}>
        {n}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2 text-sm">
          <span className="truncate">
            <span className="font-medium">{stop.code}</span>{" "}
            <span className="text-muted-foreground text-xs">
              {stop.typeLabel}
            </span>
          </span>
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {fmtMin(stop.start)} to {fmtMin(stop.end)}
          </span>
        </span>
        <span className="text-muted-foreground block truncate text-xs">
          {place}
        </span>
        {clashWith && (
          <span className="text-destructive mt-0.5 flex items-center gap-1 text-xs font-medium">
            <AlertTriangle className="size-3 shrink-0" />
            Clashes with {clashWith.join(", ")}
          </span>
        )}
      </span>
    </button>
  )
}

export const LegRow = ({ a, b, leg }: { a: Stop; b: Stop; leg?: Leg }) => {
  const gap = b.start - a.end
  let text: string
  let status: LegStatus = "ok"
  if (gap < 0) {
    text = `Overlaps by ${-gap} min`
    status = "tight"
  } else if (a.venueKey === b.venueKey) text = "Same venue"
  else if (!a.venue || !b.venue || gap > MAX_GAP) text = `${gap} min break`
  else if (!leg) text = "Working out the walk..."
  else {
    status = leg.status
    text = `${leg.walkMin} min walk · ${gap} min break`
    if (leg.status === "tight") text += " · too tight"
  }
  return (
    <div className="ml-3 flex items-center gap-3 py-1.5">
      <span className="flex w-6 shrink-0 justify-center">
        {gap < 0 ? (
          <AlertTriangle className="text-destructive size-3.5" />
        ) : (
          <Footprints className={cn("size-3.5", statusText[status])} />
        )}
      </span>
      <span
        className={cn("text-xs", statusText[status], gap < 0 && "font-medium")}>
        {text}
      </span>
    </div>
  )
}
