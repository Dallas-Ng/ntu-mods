"use client"

// A student's day on the map: classes in order, the walk between each pair
// and whether it fits the gap. Not used by /maps; the timetable page will use
// it to show "my day" (see the plan in the project memory).
import { useEffect, useMemo, useState } from "react"
import { Footprints, MapPinOff } from "lucide-react"

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

export const typeColour = (type: string) =>
  `hsl(var(--index-${getIndexType(type).toLowerCase()}-border))`

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

  // Walking legs between consecutive classes at different places.
  useEffect(() => {
    if (!data) return
    let live = true
    stops.slice(1).forEach((b, i) => {
      const a = stops[i]
      if (!a.venue || !b.venue || a.venueKey === b.venueKey) return
      const gap = b.start - a.end
      const from = a.venue
      const to = b.venue
      fetchWalk(from, to).then((walk) => {
        if (!live) return
        const w = walk ?? estimateWalk(from, to)
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
      })
    })
    return () => {
      live = false
    }
  }, [data, stops])

  const pins: Pin[] = useMemo(() => {
    const byVenue = new Map<string, Pin>()
    stops.forEach((s, i) => {
      const v = s.venue
      if (!v) return
      const pin = byVenue.get(s.venueKey)
      if (pin) pin.numbers.push(i + 1)
      else
        byVenue.set(s.venueKey, {
          id: s.id,
          x: v.x,
          y: v.y,
          z: v.z,
          label: s.venueKey,
          numbers: [i + 1],
          colour: typeColour(s.type),
          approx: v.how === "fuzzy",
          building: v.b
        })
    })
    return [...byVenue.values()]
  }, [stops])

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
      tight: all.filter((l) => l.status === "tight").length,
      close: all.filter((l) => l.status === "close").length
    }
  }, [stops, legs])

  return { stops, legs, pins, routes, summary }
}

export const StopRow = ({
  data,
  stop,
  n,
  selected,
  onClick
}: {
  data: VenueData
  stop: Stop
  n: number
  selected: boolean
  onClick: () => void
}) => {
  const v = stop.venue
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "bg-card hover:bg-accent w-full cursor-pointer rounded-lg border border-l-4 p-3 text-left transition-colors",
        selected && "ring-primary/50 ring-2"
      )}
      style={{ borderLeftColor: typeColour(stop.type) }}>
      <div className="flex items-start gap-3">
        <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {stop.code}{" "}
            <span className="text-muted-foreground text-xs font-normal">
              {stop.type} {stop.group}
            </span>
          </p>
          <p className="text-muted-foreground text-xs">
            {fmtMin(stop.start)} to {fmtMin(stop.end)} · {stop.venueKey}
          </p>
          {v ? (
            <p className="mt-0.5 truncate text-xs">
              {v.name}
              {v.z !== 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  · {levelLabel(data, v.z)}
                </span>
              )}
              {v.how === "fuzzy" && (
                <span className="text-muted-foreground"> · approximate</span>
              )}
            </p>
          ) : (
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
              <MapPinOff className="size-3" />{" "}
              {stop.venueKey && stop.venueKey !== "ONLINE"
                ? "Not on the map yet"
                : "Online or no venue"}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

export const LegRow = ({
  data,
  a,
  b,
  leg
}: {
  data: VenueData
  a: Stop
  b: Stop
  leg?: Leg
}) => {
  const gap = b.start - a.end
  let text: string
  let status: LegStatus = "ok"
  if (a.venueKey === b.venueKey) text = "Same venue"
  else if (!a.venue || !b.venue) text = `${gap} min between classes`
  else if (!leg) text = "Working out the walk..."
  else {
    status = leg.status
    const levels = leg.walk.changes.length
      ? ` · ${levelLabel(data, a.venue.z)} to ${levelLabel(data, b.venue.z)}`
      : ""
    text = `${leg.walkMin} min walk · ${leg.walk.metres} m${levels} · ${gap} min gap${leg.estimated ? " (estimated)" : ""}`
    if (leg.status === "tight") text += " · too tight"
  }
  return (
    <div className="ml-[22px] flex items-center gap-2 border-l-2 border-dashed py-2 pl-5">
      <Footprints className={cn("size-3.5 shrink-0", statusText[status])} />
      <span className={cn("text-xs", statusText[status])}>{text}</span>
    </div>
  )
}
