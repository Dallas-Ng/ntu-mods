"use client"

import {
  Suspense,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  EyeOff,
  Maximize2,
  Minimize2,
  MoveHorizontal,
  MoveVertical,
  RefreshCcw,
  ServerCrash,
  ZoomIn,
  ZoomOut
} from "lucide-react"

import { latestSemester, latestYear } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"
import { useTimetableIndexes } from "@/hooks/use-timetable-indexes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import ScreenshotInfoButton from "@/components/screenshot/screenshot-info-button"
import { TimetableTable } from "@/components/timetable-table/table"
import { TimetableTableLoader } from "@/components/timetable-table/table-loader"

type CanvasPreset = "viewport" | "iphoneTall" | "androidTall" | "classic"

type CanvasPresetOption = {
  label: string
  description: string
  aspectRatio?: string
}

type WallpaperCanvasProps = {
  canvasRef: RefObject<HTMLDivElement | null>
  preset: CanvasPreset
  selectedPreset: CanvasPresetOption
  scale: number
  offsetX: number
  offsetY: number
  timetableRef: RefObject<HTMLDivElement | null>
}

type EditorToolbarProps = {
  showControls: boolean
  preset: CanvasPreset
  scale: number
  offsetX: number
  offsetY: number
  onPresetChange: (preset: CanvasPreset) => void
  onScaleChange: (scale: number) => void
  onScaleStep: (amount: number) => void
  onOffsetXChange: (value: number) => void
  onOffsetYChange: (value: number) => void
  onFitWidth: () => void
  onFitHeight: () => void
  onCenter: () => void
  onHideControls: () => void
  positionStep: number
}

type ControlGroupProps = {
  title: string
  children: ReactNode
}

type OffsetControlProps = {
  label: "X" | "Y"
  icon: typeof MoveHorizontal
  value: number
  step: number
  onChange: (value: number) => void
}

const MIN_SCALE = 0.45
const MAX_SCALE = 1.8

const CANVAS_PRESETS: Record<CanvasPreset, CanvasPresetOption> = {
  viewport: {
    label: "Current screen",
    description: "Match this browser viewport."
  },
  iphoneTall: {
    label: "iPhone tall",
    description: "Modern lockscreen shape.",
    aspectRatio: "9 / 19.5"
  },
  androidTall: {
    label: "Android tall",
    description: "Common tall Android shape.",
    aspectRatio: "9 / 20"
  },
  classic: {
    label: "Classic 9:16",
    description: "Simple wallpaper ratio.",
    aspectRatio: "9 / 16"
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const ScreenshotPage = () => {
  return (
    <Suspense fallback={null}>
      <ScreenshotPageContent />
    </Suspense>
  )
}

const ScreenshotPageContent = () => {
  const { isMobile } = useSettings()
  const [showControls, setShowControls] = useState(true)
  const [preset, setPreset] = useState<CanvasPreset>("viewport")
  const [scale, setScale] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const canvasRef = useRef<HTMLDivElement>(null)
  const timetableRef = useRef<HTMLDivElement>(null)

  const { timetable } = useTimetable()

  const positionStep = isMobile ? 8 : 18
  const hasTimetable = Object.keys(timetable).length > 0
  const selectedPreset = CANVAS_PRESETS[preset]

  const updateScale = (nextScale: number) => {
    setScale(clamp(Number(nextScale.toFixed(2)), MIN_SCALE, MAX_SCALE))
  }

  const changeScale = (amount: number) => {
    setScale((prevScale) =>
      clamp(Number((prevScale + amount).toFixed(2)), MIN_SCALE, MAX_SCALE)
    )
  }

  const reset = () => {
    setScale(1)
    setOffsetX(0)
    setOffsetY(0)
  }

  const fitToCanvas = (axis: "width" | "height") => {
    const canvas = canvasRef.current
    const timetableElement = timetableRef.current

    if (!canvas || !timetableElement) return

    const canvasRect = canvas.getBoundingClientRect()
    const timetableRect = timetableElement.getBoundingClientRect()
    const baseWidth = timetableRect.width / scale
    const baseHeight = timetableRect.height / scale
    const target =
      axis === "width"
        ? (canvasRect.width * 0.9) / baseWidth
        : (canvasRect.height * 0.72) / baseHeight

    updateScale(target)
    setOffsetX(0)
    setOffsetY(0)
  }

  return (
    <div
      className="bg-muted/40 relative z-[1] flex h-[100svh] w-screen items-center justify-center overflow-hidden p-3 sm:p-6"
      onClick={() => setShowControls((p) => !p)}>
      {!hasTimetable && (
        <div
          className="w-full max-w-xl"
          onClick={(event) => event.stopPropagation()}>
          <Link href="/timetable">
            <Alert className="bg-background hover:bg-accent border shadow-lg transition-colors">
              <ServerCrash className="size-5" />

              <AlertTitle>Your timetable is empty!</AlertTitle>

              <AlertDescription>
                Click here to add modules into your timetable
              </AlertDescription>
            </Alert>
          </Link>
        </div>
      )}

      {hasTimetable && (
        <WallpaperCanvas
          canvasRef={canvasRef}
          preset={preset}
          selectedPreset={selectedPreset}
          scale={scale}
          offsetX={offsetX}
          offsetY={offsetY}
          timetableRef={timetableRef}
        />
      )}

      <div
        className={cn(
          "fixed top-3 left-0 flex w-full justify-center px-3 transition-all duration-300",
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        )}>
        <span className="bg-background text-muted-foreground w-fit rounded-md border px-3 py-1.5 text-center text-xs shadow">
          Compose the wallpaper, then hide controls before taking your
          screenshot.
        </span>
      </div>

      <EditorToolbar
        showControls={showControls}
        preset={preset}
        scale={scale}
        offsetX={offsetX}
        offsetY={offsetY}
        onPresetChange={setPreset}
        onScaleChange={updateScale}
        onScaleStep={changeScale}
        onOffsetXChange={setOffsetX}
        onOffsetYChange={setOffsetY}
        onFitWidth={() => fitToCanvas("width")}
        onFitHeight={() => fitToCanvas("height")}
        onCenter={reset}
        onHideControls={() => setShowControls(false)}
        positionStep={positionStep}
      />
    </div>
  )
}

const WallpaperCanvas = ({
  canvasRef,
  preset,
  selectedPreset,
  scale,
  offsetX,
  offsetY,
  timetableRef
}: WallpaperCanvasProps) => {
  return (
    <div
      ref={canvasRef}
      aria-label={`${selectedPreset.label} wallpaper preview`}
      className={cn(
        "bg-background text-foreground relative flex items-center justify-center overflow-hidden shadow-2xl transition-all duration-300",
        preset === "viewport"
          ? "size-full shadow-none"
          : "h-[min(calc(100svh-1.5rem),900px)] max-h-full max-w-full rounded-lg"
      )}
      style={
        selectedPreset.aspectRatio
          ? { aspectRatio: selectedPreset.aspectRatio }
          : undefined
      }>
      <div
        ref={timetableRef}
        className="w-[880px] max-w-[92%] transition-transform duration-200"
        style={{
          transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`
        }}>
        <ScreenshotTimetable />
      </div>
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

const EditorToolbar = ({
  showControls,
  preset,
  scale,
  offsetX,
  offsetY,
  onPresetChange,
  onScaleChange,
  onScaleStep,
  onOffsetXChange,
  onOffsetYChange,
  onFitWidth,
  onFitHeight,
  onCenter,
  onHideControls,
  positionStep
}: EditorToolbarProps) => {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 flex h-fit w-full justify-center px-3 transition-all duration-300 sm:bottom-5",
        showControls ? "opacity-100" : "pointer-events-none opacity-0"
      )}>
      <div
        className="bg-background/95 max-h-[62svh] w-89.5 max-w-full min-w-0 space-y-3 overflow-y-auto rounded-t-lg border p-3 shadow-2xl backdrop-blur sm:max-h-[min(70svh,560px)] sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-wrap items-center justify-between gap-1">
          <Link href="/timetable">
            <Button className="gap-1 text-sm" variant="outline" size="sm">
              <ArrowLeft className="size-4" /> Timetable
            </Button>
          </Link>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={onHideControls}>
              <EyeOff className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Reset composition"
              onClick={onCenter}>
              <RefreshCcw className="size-4" />
            </Button>
            <ScreenshotInfoButton />
          </div>
        </div>

        <ControlGroup title="Canvas">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={preset}
              onValueChange={(value) => onPresetChange(value as CanvasPreset)}>
              <SelectTrigger
                aria-label="Wallpaper canvas preset"
                className="sm:w-[220px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {Object.entries(CANVAS_PRESETS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </ControlGroup>

        <ControlGroup title="Fit">
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 px-2"
              onClick={onFitWidth}>
              <ArrowLeftRight className="size-4" />
              Width
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 px-2"
              onClick={onFitHeight}>
              <Maximize2 className="size-4" />
              Height
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 px-2"
              onClick={onCenter}>
              <Minimize2 className="size-4" />
              Center
            </Button>
          </div>
        </ControlGroup>

        <ControlGroup title="Scale">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Zoom out"
              onClick={() => onScaleStep(-0.05)}>
              <ZoomOut className="size-4" />
            </Button>

            <Input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.01}
              value={scale}
              aria-label="Timetable scale"
              className="h-9 px-0 shadow-none"
              onChange={(event) => onScaleChange(Number(event.target.value))}
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Zoom in"
              onClick={() => onScaleStep(0.05)}>
              <ZoomIn className="size-4" />
            </Button>

            <span className="text-muted-foreground w-11 text-right text-xs">
              {Math.round(scale * 100)}%
            </span>
          </div>
        </ControlGroup>

        <ControlGroup title="Position">
          <div className="flex justify-center gap-2">
            <OffsetControl
              label="X"
              icon={MoveHorizontal}
              value={offsetX}
              step={positionStep}
              onChange={onOffsetXChange}
            />

            <OffsetControl
              label="Y"
              icon={MoveVertical}
              value={offsetY}
              step={positionStep}
              onChange={onOffsetYChange}
            />
          </div>
        </ControlGroup>
      </div>
    </div>
  )
}

const ControlGroup = ({ title, children }: ControlGroupProps) => {
  return (
    <section className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium uppercase">
        {title}
      </p>

      {children}
    </section>
  )
}

const OffsetControl = ({
  label,
  icon: Icon,
  value,
  step,
  onChange
}: OffsetControlProps) => {
  const DecreaseIcon = label === "X" ? ArrowLeft : ArrowUp
  const IncreaseIcon = label === "X" ? ArrowRight : ArrowDown

  return (
    <div className="space-y-1 rounded-md border p-1.5">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span className="flex items-center gap-1">
          <Icon className="size-3.5" />
          {label}
        </span>
        <span>{value}px</span>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={`Move ${label} backward`}
          onClick={() => onChange(value - step)}>
          <DecreaseIcon className="size-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={`Reset ${label} offset`}
          onClick={() => onChange(0)}>
          <RefreshCcw className="size-3.5" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={`Move ${label} forward`}
          onClick={() => onChange(value + step)}>
          <IncreaseIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export default ScreenshotPage
