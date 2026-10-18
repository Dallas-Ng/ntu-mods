"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  Camera,
  Hand,
  RefreshCcw,
  ServerCrash,
  ZoomIn,
  ZoomOut
} from "lucide-react"

import { track } from "@/lib/analytics"
import { latestSemester, latestYear } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"
import { useTimetableIndexes } from "@/hooks/use-timetable-indexes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import ScreenshotInfoButton from "@/components/screenshot/screenshot-info-button"
import { TimetableTable } from "@/components/timetable-table/table"
import { TimetableTableLoader } from "@/components/timetable-table/table-loader"

type CanvasPreset = "viewport" | "phone" | "classic"

const MIN_SCALE = 0.45
const MAX_SCALE = 1.8

const CANVAS_PRESETS: Record<
  CanvasPreset,
  { label: string; aspectRatio?: string }
> = {
  viewport: { label: "Screen" },
  phone: { label: "Phone", aspectRatio: "9 / 19.5" },
  classic: { label: "9:16", aspectRatio: "9 / 16" }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const ScreenshotPageContent = () => {
  return (
    <Suspense fallback={null}>
      <ScreenshotPageInner />
    </Suspense>
  )
}

const ScreenshotPageInner = () => {
  const [showControls, setShowControls] = useState(true)
  const [hint, setHint] = useState(false)
  const [preset, setPreset] = useState<CanvasPreset>("viewport")
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number } | null>(null)

  const { isMobile } = useSettings()
  const { timetable } = useTimetable()
  const hasTimetable = Object.keys(timetable).length > 0
  const { aspectRatio } = CANVAS_PRESETS[preset]

  // brief "tap to bring controls back" pill after hiding
  useEffect(() => {
    if (showControls) return setHint(false)
    setHint(true)
    const id = setTimeout(() => setHint(false), 2500)
    return () => clearTimeout(id)
  }, [showControls])

  const changeScale = (next: number) =>
    setScale(clamp(Number(next.toFixed(2)), MIN_SCALE, MAX_SCALE))

  const reset = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  const hide = () => {
    setShowControls(false)
    track("screenshot_controls_hidden", { preset })
  }

  return (
    <div
      className="bg-muted/40 relative z-[1] flex h-[100svh] w-screen items-center justify-center overflow-hidden p-3 sm:p-6"
      onClick={() => !showControls && setShowControls(true)}>
      {!hasTimetable ? (
        <a href="/timetable" className="w-full max-w-xl">
          <Alert className="bg-background hover:bg-accent border shadow-lg transition-colors">
            <ServerCrash className="size-5" />
            <AlertTitle>Your timetable is empty!</AlertTitle>
            <AlertDescription>
              Click here to add modules into your timetable
            </AlertDescription>
          </Alert>
        </a>
      ) : (
        <div
          className={cn(
            "bg-background text-foreground relative flex items-center justify-center overflow-hidden transition-all duration-300",
            preset === "viewport"
              ? "size-full"
              : "h-[min(calc(100svh-1.5rem),900px)] max-h-full max-w-full rounded-lg shadow-2xl"
          )}
          style={{ aspectRatio }}>
          <div
            className={cn(
              "w-[880px] max-w-[92%] touch-none",
              showControls && "cursor-grab active:cursor-grabbing"
            )}
            style={{
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`
            }}
            onPointerDown={(e) => {
              if (!showControls) return
              e.currentTarget.setPointerCapture(e.pointerId)
              drag.current = {
                x: e.clientX - offset.x,
                y: e.clientY - offset.y
              }
            }}
            onPointerMove={(e) => {
              if (drag.current)
                setOffset({
                  x: e.clientX - drag.current.x,
                  y: e.clientY - drag.current.y
                })
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}>
            <ScreenshotTimetable />
          </div>
        </div>
      )}

      {hint && (
        <span className="bg-foreground text-background pointer-events-none fixed top-4 rounded-full px-4 py-2 text-sm shadow-lg">
          Take your screenshot. Tap to show controls.
        </span>
      )}

      {hasTimetable && (
        <div
          className={cn(
            "fixed bottom-0 left-0 flex w-full justify-center px-3 transition-opacity duration-300 sm:bottom-5",
            showControls ? "opacity-100" : "pointer-events-none opacity-0"
          )}>
          <div
            className="bg-background/95 w-full max-w-sm space-y-3 rounded-t-lg border p-3 shadow-2xl backdrop-blur sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <a href="/timetable">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="size-4" /> Timetable
                </Button>
              </a>
              <ScreenshotInfoButton />
            </div>

            {/* on a phone "Screen" is already the exact shape */}
            {!isMobile && (
              <ToggleGroup
                type="single"
                variant="outline"
                className="w-full"
                value={preset}
                aria-label="Wallpaper shape"
                onValueChange={(value) => {
                  if (!value) return
                  setPreset(value as CanvasPreset)
                  track("screenshot_preset_selected", {
                    preset: value
                  })
                }}>
                {Object.entries(CANVAS_PRESETS).map(([key, { label }]) => (
                  <ToggleGroupItem key={key} value={key} className="flex-1">
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Zoom out"
                onClick={() => changeScale(scale - 0.05)}>
                <ZoomOut className="size-4" />
              </Button>
              <Input
                type="range"
                min={MIN_SCALE}
                max={MAX_SCALE}
                step={0.01}
                value={scale}
                aria-label="Timetable size"
                className="h-9 px-0 shadow-none"
                onChange={(e) => changeScale(Number(e.target.value))}
              />
              <Button
                variant="outline"
                size="icon"
                aria-label="Zoom in"
                onClick={() => changeScale(scale + 0.05)}>
                <ZoomIn className="size-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <Hand className="size-3.5" /> Drag timetable to move
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Reset"
                  onClick={reset}>
                  <RefreshCcw className="size-4" />
                </Button>
              </div>
            </div>

            <Button className="w-full gap-2" onClick={hide}>
              <Camera className="size-4" /> Hide controls to screenshot
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const ScreenshotTimetable = () => {
  const { timetable } = useTimetable()
  const { moduleIndexMap, isLoading } = useTimetableIndexes(
    timetable,
    latestYear,
    latestSemester
  )

  if (isLoading && !Object.keys(moduleIndexMap).length) {
    return <TimetableTableLoader />
  }

  return <TimetableTable moduleIndexMap={moduleIndexMap} />
}

export default ScreenshotPageContent
