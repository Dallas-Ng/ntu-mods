"use client"

import { Fragment, useEffect, useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CampusMap from "@/components/map/campus-map"
import { LegRow, StopRow } from "@/components/map/day-route"
import { useWalkDay } from "@/components/timetable/use-walk-day"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const NO_CATS = new Set<never>()

const TimetableDayPanel = () => {
  const [selected, setSelected] = useState<string>()
  const [level, setLevel] = useState<number | null>(null)
  const [full, setFull] = useState(false)
  const [phone, setPhone] = useState(false)
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

  // Loading, empty and loaded all share one box height, so the dialog never
  // jumps as the map arrives.
  const empty = !loading && busyDays.size === 0
  const idle = loading || empty

  const leg = summary.metres
    ? `${stops.length} classes · ${(summary.metres / 1000).toFixed(1)} km walking`
    : `${stops.length} classes`
  const warn = [
    summary.clashes &&
      `${summary.clashes} clash${summary.clashes > 1 ? "es" : ""}`,
    summary.tight && `${summary.tight} too tight`,
    summary.close && `${summary.close} close`
  ].filter(Boolean)

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-1.5">
        <Tabs
          value={String(day)}
          onValueChange={(v) => setDay(Number(v))}
          className={idle ? "pointer-events-none opacity-50" : undefined}>
          <TabsList>
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
        {!idle && (
          <p className="text-muted-foreground text-xs">
            {leg}
            {warn.length > 0 && (
              <span className="text-destructive"> · {warn.join(", ")}</span>
            )}
          </p>
        )}
      </div>

      <div
        className={
          empty
            ? "grid"
            : "grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
        }>
        {!empty && (
          <div className="md:h-[22rem] md:overflow-y-auto">
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
                      data={data}
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
                    onClick={() =>
                      setSelected((cur) => (cur === s.id ? undefined : s.id))
                    }
                  />
                </Fragment>
              ))
            )}
          </div>
        )}

        <div
          className={
            full
              ? "bg-background fixed inset-0 z-[60]"
              : "relative order-first h-64 overflow-hidden rounded-lg border md:order-none md:h-[22rem]"
          }>
          {data && !loading ? (
            <CampusMap
              data={data}
              level={level}
              onLevel={setLevel}
              pins={pins}
              routes={routes}
              onPin={(id) => setSelected(id)}
              cats={NO_CATS}
              buildingLabels
              roomLabels={false}
              focus={focus}
              noIntro
              fullscreen={full}
              pinned={full}
              preview={phone && !full}
              onFullscreen={() => setFull((f) => !f)}
              className="absolute inset-0"
            />
          ) : (
            <Skeleton className="size-full rounded-none" />
          )}
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
      </div>

      <p className="text-muted-foreground text-xs">
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
