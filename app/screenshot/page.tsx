"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useBoundState } from "@/state/bound-state"
import {
  EyeOff,
  GalleryHorizontal,
  GalleryVerticalEnd,
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

import { getQsFromCourseToIndexes } from "@/lib/get-qs-from-course-to-index"
import { BASE_URL, cn } from "@/lib/utils"
import { useQueryStringCTI } from "@/hooks/use-qs-CTI"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import StarsShareButton from "@/components/stars/stars-buttons/stars-share-button"

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

const StarsTable = dynamic(() => import("@/components/stars/stars-table"), {
  ssr: false
})

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
  const router = useRouter()
  const { info } = useBoundState()
  const [showTaskbar, setShowTaskbar] = useState(true)
  const [padding, setPadding] = useState(DEFAULT_PADDING)
  const [align, setAlign] = useState<Align>("start")
  const [scale, setScale] = useState(1)

  const coursesToIndexFromQueryString = useQueryStringCTI()
  const coursesToIndexFromState = useBoundState().coursesToIndex

  /**
   * Pirority of coursesToIndex:
   *    1. props.coursesToIndex
   *    2. coursesToIndexFromQueryString
   *    3. coursesToIndexFromState
   */
  let coursesToIndex =
    Object.keys(coursesToIndexFromQueryString).length > 0
      ? coursesToIndexFromQueryString
      : coursesToIndexFromState

  const STEP = info.mobile ? 10 : 50

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

  function changePadding(paddingDirection: Padding, direction: Direction) {
    return setPadding((exPadding) => ({
      ...exPadding,
      [paddingDirection]:
        exPadding[paddingDirection] + (direction === "increase" ? STEP : -STEP)
    }))
  }

  function reset() {
    setPadding(DEFAULT_PADDING)
    setAlign("start")
    setScale(1)
  }

  return (
    <div
      className="relative z-[1] min-h-screen w-screen"
      onClick={() => setShowTaskbar((p) => !p)}>
      {Object.keys(coursesToIndex).length === 0 && (
        <div className="p-5">
          <Link href="/stars">
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
        <StarsTable disablePopup coursesToIndex={coursesToIndex} />
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "fixed bottom-[3.5%] left-0 flex h-fit w-full justify-center transition-all duration-300",
          showTaskbar ? "opacity-100" : "pointer-events-none opacity-0"
        )}>
        <div className="flex flex-col gap-2 rounded-lg border bg-background p-2 shadow">
          <div className="w-full text-center text-sm text-secondary">
            <span>Screenshot or use the snipping tool to save</span>
          </div>

          <div className="flex gap-4">
            <div className="grid h-fit w-fit grid-cols-4 gap-2">
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

              {/* <Button
                variant="outline"
                size="icon"
                onClick={() => setAlign("end")}>
                <GalleryVerticalEnd className="h-5 w-5" />
              </Button>

              <Button variant="outline" size="icon">
                <GalleryHorizontal
                  className="h-5 w-5 rotate-180"
                  onClick={() => setAlign("center")}
                />
              </Button>

              <Button variant="outline" size="icon">
                <GalleryVerticalEnd
                  className="h-5 w-5 rotate-180"
                  onClick={() => setAlign("start")}
                />
              </Button> */}

              <Button
                variant="outline"
                size="icon"
                onClick={() => setScale((prevScale) => prevScale + 0.1)}>
                <ZoomIn className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setScale((prevScale) => prevScale - 0.1)}>
                <ZoomOut className="h-5 w-5" />
              </Button>

              {/* <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowTaskbar(false)
                }}>
                <EyeOff className="h-5 w-5" />
              </Button> */}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="icon" onClick={reset}>
                <RefreshCcw className="h-5 w-5" />
              </Button>

              <ScreenshotSettingsButton />

              <div className="col-span-2">
                <StarsShareButton
                  hideText={false}
                  coursesToIndex={coursesToIndex}
                  path="screenshot"
                />
              </div>
            </div>
          </div>

          <div>
            <Link href="/stars">
              <Button size="sm" className="w-full text-sm" variant="outline">
                Go to Timetable
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
