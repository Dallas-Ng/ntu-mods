"use client"

import { Fragment, useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { track } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { type Stop } from "@/lib/venue-map"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CampusMap, { type Focus } from "@/components/map/campus-map"
import { LegRow, StopRow } from "@/components/map/day-route"
import { useWalkDay } from "@/components/timetable/use-walk-day"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const NO_CATS = new Set<never>()

const TimetableDayPanel = () => {
  const [selected, setSelected] = useState<string>()
  const [level, setLevel] = useState<number | null>(null)
  const [full, setFull] = useState(false)
  const [phone, setPhone] = useState(false)
  // Where the map was sent by clicking a class; null shows the whole day.
  const [zoom, setZoom] = useState<Focus | null>(null)
  const {
    loading,
    data,
    busyDays,
    day,
    setDay,
    focus,
    stops,
    legs,
    pins,
    routes,
    summary,
    clashes
  } = useWalkDay(true, selected)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const sync = () => setPhone(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // A new day starts from the whole route.
  useEffect(() => {
    setSelected(undefined)
    setZoom(null)
  }, [day])

  // Clicking a class zooms the map to its venue; clicking it again goes back.
  const pick = (s: Stop) => {
    track("walk_route_stop_selected", { deselected: selected === s.id })
    if (selected === s.id) {
      setSelected(undefined)
      setZoom(focus ? { ...focus, nonce: Date.now() } : null)
      return
    }
    setSelected(s.id)
    if (s.venue) {
      const pad = 70
      setZoom({
        bounds: [
          s.venue.x - pad,
          s.venue.y - pad,
          s.venue.x + pad,
          s.venue.y + pad
        ],
        nonce: Date.now()
      })
    }
  }

  const empty = !loading && busyDays.size === 0

  const leg = summary.metres
    ? `${stops.length} classes · ${(summary.metres / 1000).toFixed(1)} km walking`
    : `${stops.length} classes`
  const warn = [
    summary.clashes &&
      `${summary.clashes} clash${summary.clashes > 1 ? "es" : ""}`,
    summary.tight && `${summary.tight} too tight`,
    summary.close && `${summary.close} close`
  ].filter(Boolean)

  const map =
    data && !loading ? (
      <CampusMap
        data={data}
        level={level}
        onLevel={setLevel}
        pins={pins}
        routes={routes}
        onPin={(id) => {
          const s = stops.find((x) => x.id === id)
          if (s) pick(s)
        }}
        cats={NO_CATS}
        buildingLabels
        roomLabels={false}
        focus={zoom ?? focus}
        noIntro
        fullscreen={full}
        pinned={full}
        preview={phone && !full}
        onFullscreen={() => setFull((f) => !f)}
        className="absolute inset-0"
      />
    ) : (
      <Skeleton className="size-full rounded-none" />
    )

  const mapBox = (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border",
        full
          ? "bg-background pointer-events-auto fixed inset-0 z-[60] rounded-none border-0"
          : "h-80 lg:h-auto lg:flex-1"
      )}>
      {map}
      {empty && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-black/60 p-4 text-center text-sm text-white">
          <p className="font-medium">
            Add modules to your plan to see the walks between classes.
          </p>
          <p className="text-white/80">
            Just want to look around?{" "}
            <a
              href="/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-2">
              Open the campus map
            </a>
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div>
      {/* Both columns share one height, so the dialog never jumps as things
          load: the list scrolls inside it and the map fills the other side. */}
      <div className="flex flex-col gap-6 lg:h-[26rem] lg:flex-row lg:gap-4">
        {!empty && (
          <div className="flex min-h-0 flex-col gap-4 lg:w-2/5 lg:gap-3">
            <Tabs
              value={String(day)}
              onValueChange={(v) => {
                setDay(Number(v))
                track("walk_route_day_changed", { day: Number(v) })
              }}
              className={cn(loading && "pointer-events-none opacity-50")}>
              <TabsList className="grid w-full grid-cols-7">
                {DAYS.map((d, i) => (
                  <TabsTrigger
                    key={d}
                    value={String(i + 1)}
                    disabled={!busyDays.has(i + 1)}>
                    {d}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {!loading && (
              <p className="text-muted-foreground text-center text-xs">
                {leg}
                {warn.length > 0 && (
                  <span className="text-destructive"> · {warn.join(", ")}</span>
                )}
              </p>
            )}

            <div className="min-h-0 flex-1 lg:overflow-y-auto">
              {loading || !data ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : stops.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  No classes this day.
                </p>
              ) : (
                stops.map((s, i) => (
                  <Fragment key={s.id}>
                    {i > 0 && (
                      <LegRow
                        a={stops[i - 1]}
                        b={s}
                        leg={legs[`${stops[i - 1].id}>${s.id}`]}
                      />
                    )}
                    <StopRow
                      data={data}
                      stop={s}
                      n={i + 1}
                      selected={selected === s.id}
                      clashWith={clashes.get(s.id)}
                      onClick={() => pick(s)}
                    />
                  </Fragment>
                ))
              )}
            </div>
          </div>
        )}

        {full ? createPortal(mapBox, document.body) : mapBox}
      </div>

      <p className="text-muted-foreground mt-6 text-center text-xs">
        Walking times are estimates. Map data from NTU Maps (MazeMap) and
        OpenStreetMap.{" "}
        <a
          href="/maps"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground underline underline-offset-2">
          Open campus map
        </a>
      </p>
    </div>
  )
}

export default TimetableDayPanel
