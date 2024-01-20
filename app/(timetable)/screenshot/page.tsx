"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  PanelBottomOpen,
  PanelLeftOpen,
  PanelRightOpen,
  PanelTopOpen,
  RefreshCcw,
  ServerCrash,
  ZoomIn,
  ZoomOut
} from "lucide-react"

import { BASE_URL } from "@/lib/constants"
import { getModuleIndexMap } from "@/lib/get-module-index-map"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import ScreenshotInfoButton from "@/components/screenshot/screenshot-info-button"
import { ScreenshotSettingsButtonLoader } from "@/components/screenshot/settings-button"
import ShareButton from "@/components/share-button"
import { TimetableTableLoader } from "@/components/timetable-table/table"
import TimetablePlanSwitcher from "@/components/timetable/buttons/timetable-plan-switcher"

const ScreenshotSettingsButton = dynamic(
  () => import("@/components/screenshot/settings-button"),
  {
    ssr: false,
    loading: () => <ScreenshotSettingsButtonLoader />
  }
)

const TimetableTable = dynamic(
  () => import("@/components/timetable/timetable-table"),
  {
    ssr: false,
    loading: () => <TimetableTableLoader />
  }
)

type Padding = "paddingTop" | "paddingBottom" | "paddingLeft" | "paddingRight"
type Direction = "increase" | "decrease"

const DEFAULT_PADDING = {
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0
}

export default function ScreenshotPage() {
  const { isMobile } = useSettings()
  const [showTaskbar, setShowTaskbar] = useState(true)
  const [padding, setPadding] = useState(DEFAULT_PADDING)
  const [scale, setScale] = useState(1)
  const [showPlanSwitcher, setShowPlanSwitcher] = useState(true)

  const { timetable } = useTimetable()
  const moduleIndexMap = getModuleIndexMap(timetable)

  const searchParams = useSearchParams()
  const urlParams = new URLSearchParams(timetable)
  const shareLink = `${BASE_URL}/screenshot?${urlParams.toString()}`

  const STEP = isMobile ? 10 : 50

  useEffect(() => {
    // Hide plan switcher if the user is using a share link
    if (Object.keys(Object.fromEntries(searchParams.entries())).length > 0) {
      setShowPlanSwitcher(false)
    }
  }, [searchParams])

  const changePadding = (paddingDirection: Padding, direction: Direction) => {
    return setPadding((exPadding) => ({
      ...exPadding,
      [paddingDirection]:
        exPadding[paddingDirection] + (direction === "increase" ? STEP : -STEP)
    }))
  }

  const reset = () => {
    setPadding(DEFAULT_PADDING)
    setScale(1)
  }

  return (
    <div
      className="relative z-[1] h-[100svh] w-screen"
      onClick={() => setShowTaskbar((p) => !p)}>
      {Object.keys(moduleIndexMap).length === 0 && (
        <div className="p-5">
          <Link href="/timetable">
            <Alert>
              <ServerCrash className="size-5" />

              <AlertTitle>Your timetable is empty!</AlertTitle>

              <AlertDescription>
                Click here to add modules into your timetable
              </AlertDescription>
            </Alert>
          </Link>
        </div>
      )}

      <div
        className="flex size-full items-center justify-center"
        style={{ ...padding, scale }}>
        <TimetableTable />
      </div>

      <div
        className={cn(
          "fixed left-0 top-0 flex w-full items-center justify-center",
          showTaskbar ? "opacity-100" : "pointer-events-none opacity-0"
        )}>
        <span className="w-fit rounded-b-md border-2 border-t-0 bg-background p-1 px-2 text-center text-sm shadow">
          Click anywhere on the screen to hide the toolbar
        </span>
      </div>

      <div
        className={cn(
          "fixed bottom-[3%] left-0 flex h-fit w-full justify-center transition-all duration-300",
          showTaskbar ? "opacity-100" : "pointer-events-none opacity-0"
        )}>
        <div
          className="flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between gap-1">
            <div className="w-full">
              {showPlanSwitcher && <TimetablePlanSwitcher />}
            </div>

            <ScreenshotInfoButton />

            <ShareButton
              title="See a screenshot of my timetable!"
              description="Share your timetable with your friends!"
              link={shareLink}
            />
          </div>

          <div className="rounded-lg border bg-background p-2 shadow">
            <div className="flex w-full items-center justify-between gap-2">
              <div className="grid w-fit grid-cols-3">
                {/* Row 1 */}
                <div />
                <Button variant="outline" size="icon">
                  <PanelBottomOpen
                    className="size-5"
                    onClick={() =>
                      padding.paddingTop > 0
                        ? changePadding("paddingTop", "decrease")
                        : changePadding("paddingBottom", "increase")
                    }
                  />
                </Button>
                <div />

                {/* Row 2 */}
                <Button variant="outline" size="icon">
                  <PanelRightOpen
                    className="size-5"
                    onClick={() =>
                      padding.paddingLeft > 0
                        ? changePadding("paddingLeft", "decrease")
                        : changePadding("paddingRight", "increase")
                    }
                  />
                </Button>
                <div />
                <Button variant="outline" size="icon">
                  <PanelLeftOpen
                    className="size-5"
                    onClick={() => {
                      padding.paddingRight > 0
                        ? changePadding("paddingRight", "decrease")
                        : changePadding("paddingLeft", "increase")
                    }}
                  />
                </Button>

                {/* Row 3 */}
                <div />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    padding.paddingBottom > 0
                      ? changePadding("paddingBottom", "decrease")
                      : changePadding("paddingTop", "increase")
                  }>
                  <PanelTopOpen className="size-5" />
                </Button>
                <div />
              </div>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setScale((prevScale) => prevScale + 0.05)}>
                  <ZoomIn className="size-5" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setScale((prevScale) => prevScale - 0.05)}>
                  <ZoomOut className="size-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            <div className="size-full">
              <Link href="/timetable">
                <Button className="text-sm" variant="outline">
                  <ArrowLeft className="mr-1 size-4" /> Back
                </Button>
              </Link>
            </div>

            <ScreenshotSettingsButton />

            <Button variant="outline" size="icon" onClick={reset}>
              <RefreshCcw className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
