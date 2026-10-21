"use client"

import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { Maximize2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import CampusMap from "@/components/map/campus-map"
import { useWalkDay } from "@/components/timetable/use-walk-day"

// The dialog's contents load only once it is opened.
const Panel = lazy(() => import("@/components/timetable/timetable-day-panel"))

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const NO_CATS = new Set<never>()

// A still picture of the day. It loads the map and walks only when scrolled
// into view, and takes no input: a click anywhere opens the dialog.
const Preview = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true)
        io.disconnect()
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const { data, busyDays, day, focus, stops, pins, routes, summary } =
    useWalkDay(seen)

  const warn = summary.clashes
    ? `${summary.clashes} clash${summary.clashes > 1 ? "es" : ""}`
    : summary.tight
      ? `${summary.tight} too tight`
      : summary.close
        ? `${summary.close} close`
        : null

  return (
    <div ref={ref}>
      <div className="bg-muted/50 panel-border group-hover:border-foreground/30 relative h-36 overflow-hidden rounded-lg transition-colors">
        {data ? (
          <div className="pointer-events-none absolute inset-0 [&_button]:hidden">
            <CampusMap
              data={data}
              level={null}
              onLevel={() => {}}
              pins={pins}
              routes={routes}
              onPin={() => {}}
              cats={NO_CATS}
              buildingLabels={false}
              roomLabels={false}
              focus={focus}
              noIntro
              className="absolute inset-0"
            />
          </div>
        ) : (
          <Skeleton className="size-full rounded-none" />
        )}
        <span className="bg-background/90 absolute right-2 bottom-2 flex items-center gap-1 rounded-md border px-2 py-1 text-xs">
          <Maximize2 className="size-3" />
          Open
        </span>
      </div>
      {busyDays.size > 0 && (
        <div className="pt-2 text-left">
          <p className="text-muted-foreground text-xs">
            {DAY_NAMES[day]} · {stops.length} classes
            {warn && <span className="text-destructive"> · {warn}</span>}
          </p>
        </div>
      )}
    </div>
  )
}

const TimetableDayRoute = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button
        type="button"
        className="group block w-full cursor-pointer text-left">
        <Preview />
      </button>
    </DialogTrigger>
    <DialogContent className="max-h-[90svh] max-w-4xl gap-3 overflow-y-auto p-4 sm:p-6">
      <DialogHeader>
        <DialogTitle>Walking between classes</DialogTitle>
        <DialogDescription>
          Your day on the campus map, and whether each gap is long enough.
        </DialogDescription>
      </DialogHeader>
      <Suspense fallback={<Skeleton className="h-[26.75rem] w-full" />}>
        <Panel />
      </Suspense>
    </DialogContent>
  </Dialog>
)

export default TimetableDayRoute
