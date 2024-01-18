"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  PanelBottomOpen,
  PanelLeftOpen,
  PanelRightOpen,
  PanelTopOpen,
  RefreshCcw,
  ServerCrash,
  Settings,
  ZoomIn,
  ZoomOut
} from "lucide-react"
import { toast } from "sonner"

import { BASE_URL } from "@/lib/constants"
import { getModuleIndexMap } from "@/lib/get-module-index-map"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import ShareButton from "@/components/share-button"

const ScreenshotSettingsButton = dynamic(
  () => import("@/components/screenshot/settings-button"),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" size="icon" disabled>
        <Settings className="h-5 w-5" />
      </Button>
    )
  }
)

const TimetableTable = dynamic(
  () => import("@/components/timetable/timetable-table"),
  {
    ssr: false,
    loading: () => <div>Loading...</div>
  }
)

type Padding = "paddingTop" | "paddingBottom" | "paddingLeft" | "paddingRight"
type Direction = "increase" | "decrease"
type Align = "start" | "center" | "end"

const DEFAULT_PADDING = {
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0
}

export default function ScreenshotPage() {
  const { isMobile } = useSettings()

  // TODO: use useLocalStorage?
  // Settings for screenshot
  const [showTaskbar, setShowTaskbar] = useState(true)
  const [padding, setPadding] = useState(DEFAULT_PADDING)
  const [align, setAlign] = useState<Align>("start")
  const [scale, setScale] = useState(1)

  const { timetable } = useTimetable()
  const moduleIndexMap = getModuleIndexMap(timetable)

  const urlParams = new URLSearchParams(timetable)
  const shareLink = `${BASE_URL}/screenshot?${urlParams.toString()}`

  const STEP = isMobile ? 10 : 50

  useEffect(() => {
    setTimeout(
      () =>
        toast("Click anywhere on the screen to hide the toolbar", {
          id: "screenshot-info",
          duration: 5000
        }),
      100
    )
  }, [])

  const changePadding = (paddingDirection: Padding, direction: Direction) => {
    return setPadding((exPadding) => ({
      ...exPadding,
      [paddingDirection]:
        exPadding[paddingDirection] + (direction === "increase" ? STEP : -STEP)
    }))
  }

  const reset = () => {
    setPadding(DEFAULT_PADDING)
    setAlign("start")
    setScale(1)
  }

  return (
    <div
      className="relative z-[1] min-h-screen w-screen"
      onClick={() => setShowTaskbar((p) => !p)}>
      {Object.keys(moduleIndexMap).length === 0 && (
        <div className="p-5">
          <Link href="/timetable">
            <Alert>
              <ServerCrash className="h-5 w-5" />

              <AlertTitle>Your timetable is empty!</AlertTitle>

              <AlertDescription>
                Click here to add modules into your timetable
              </AlertDescription>
            </Alert>
          </Link>
        </div>
      )}

      <div
        className="flex min-h-[100vh] items-center justify-center"
        style={{ ...padding, alignItems: align, scale }}>
        <TimetableTable />
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "fixed bottom-[3.5%] left-0 flex h-fit w-full justify-center transition-all duration-300",
          showTaskbar ? "opacity-100" : "pointer-events-none opacity-0"
        )}>
        <div className="flex flex-col gap-2 rounded-lg border bg-background p-2 shadow">
          <div className="w-fit text-center text-sm text-secondary">
            <span>Screenshot or use a snipping tool to save</span>
          </div>

          <div className="grid h-fit w-full grid-cols-6 gap-2">
            <Button variant="outline" size="icon">
              <PanelRightOpen
                className="h-5 w-5"
                onClick={() =>
                  padding.paddingLeft > 0
                    ? changePadding("paddingLeft", "decrease")
                    : changePadding("paddingRight", "increase")
                }
              />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                padding.paddingBottom > 0
                  ? changePadding("paddingBottom", "decrease")
                  : changePadding("paddingTop", "increase")
              }>
              <PanelTopOpen className="h-5 w-5" />
            </Button>

            <Button variant="outline" size="icon">
              <PanelBottomOpen
                className="h-5 w-5"
                onClick={() =>
                  padding.paddingTop > 0
                    ? changePadding("paddingTop", "decrease")
                    : changePadding("paddingBottom", "increase")
                }
              />
            </Button>

            <Button variant="outline" size="icon">
              <PanelLeftOpen
                className="h-5 w-5"
                onClick={() => {
                  padding.paddingRight > 0
                    ? changePadding("paddingRight", "decrease")
                    : changePadding("paddingLeft", "increase")
                }}
              />
            </Button>

            <Button variant="outline" size="icon" onClick={reset}>
              <RefreshCcw className="h-5 w-5" />
            </Button>

            <ScreenshotSettingsButton />

            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale((prevScale) => prevScale + 0.05)}>
              <ZoomIn className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale((prevScale) => prevScale - 0.05)}>
              <ZoomOut className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="h-full w-full">
              <Link href="/timetable">
                <Button className="w-full text-sm" variant="outline">
                  Go to Timetable
                </Button>
              </Link>
            </div>

            <ShareButton
              title="See a screenshot of my timetable!"
              description="Share your timetable with your friends!"
              link={shareLink}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
