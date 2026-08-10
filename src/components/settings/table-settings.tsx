"use client"

import { useEffect, useState } from "react"
import { RefreshCcw } from "lucide-react"
import posthog from "posthog-js"

import { TRUN_DAY_MAP } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"

import TimetableCell from "../timetable/timetable-cell"
import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"
import { Switch } from "../ui/switch"
import { Toggle } from "../ui/toggle"

interface RandomModuleData {
  code: string
  title: string
  indexKey: string
  index: Index
}

interface Props {
  toggleBorder?: boolean
}

const TableSettings = ({ toggleBorder = false }: Props) => {
  const { settings, updateSettings } = useSettings()
  const { tableCell, standardisedScale } = settings
  const [samples, setSamples] = useState<RandomModuleData[]>([])
  const [randomData, setRandomData] = useState<RandomModuleData | null>(null)
  const [rerollKey, setRerollKey] = useState(0)

  useEffect(() => {
    if (samples.length > 0) {
      setRandomData(samples[rerollKey % samples.length])
      return
    }
    const controller = new AbortController()
    fetch("/data/api/random-samples.json", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RandomModuleData[]) => {
        if (data.length > 0) {
          setSamples(data)
          setRandomData(data[rerollKey % data.length])
        }
      })
      .catch(() => {})
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rerollKey])

  const reRollIndex = () => setRerollKey((k) => k + 1)

  const updateTableCell = (checked: boolean, key: keyof typeof tableCell) => {
    updateSettings({
      ...settings,
      tableCell: { ...tableCell, [key]: checked }
    })
    posthog.capture("settings_table_changed", { setting: key, value: checked })
  }

  if (!randomData) return <TableSettingsLoading />

  const { code: moduleKey, title, index } = randomData

  return (
    <>
      <div
        id="table-settings"
        className="flex flex-col items-center justify-center gap-2 lg:flex-row">
        <div className="relative flex h-[200px] w-full flex-col justify-between rounded-lg border-2 p-3 md:w-10/12 lg:h-[230px] lg:w-[384px]">
          <div className="flex justify-between gap-0 lg:flex-row">
            <table className="h-min w-[65%] border-none">
              <tbody>
                <tr>
                  <TimetableCell
                    divClassName="h-min w-full cursor-default text-xs"
                    tdClassName="border-none"
                    moduleKey={moduleKey}
                    index={index}
                  />
                </tr>
              </tbody>
            </table>

            <table className="h-min w-[35%] border-none">
              <tbody>
                <tr>
                  <TimetableCell
                    divClassName="h-min w-full cursor-default text-xs"
                    tdClassName="border-none"
                    moduleKey={moduleKey}
                    index={index}
                  />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex w-full items-baseline justify-between">
            <p className="text-muted-foreground w-full truncate text-xs capitalize">
              {title}
            </p>

            <Button
              onClick={reRollIndex}
              variant="outline"
              size="icon"
              className="ml-2 w-[40px]">
              <RefreshCcw className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-1 md:w-10/12 lg:w-fit">
          {(Object.keys(tableCell) as (keyof typeof tableCell)[]).map((key) => {
            if (["duration"].includes(key)) return

            return (
              <Toggle
                key={key}
                className={cn(
                  "h-fit w-full py-1 lg:w-[110px]",
                  key === "remarks" && "col-span-2 lg:w-full",
                  toggleBorder && "border"
                )}
                pressed={tableCell[key]}
                onPressedChange={(val) => updateTableCell(val, key)}>
                <div>
                  <p className="capitalize">{key === "key" ? "Index" : key} </p>

                  <span className="text-muted-foreground text-xs">
                    {!["day", "remarks"].includes(key) && index[key]}

                    {key === "day" &&
                      index[key] > 0 &&
                      (TRUN_DAY_MAP as Record<number, string>)[index[key]]}

                    {key === "remarks" &&
                      (index[key] === "" ? "No Remarks" : index[key])}
                  </span>
                </div>
              </Toggle>
            )
          })}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
          <span>
            <p className="text-sm font-medium">Standardised scale</p>
            <span className="text-muted-foreground text-xs">
              Give every 30 min timeslot the same height, so breaks and lessons
              are visually comparable
            </span>
          </span>

          <Switch
            checked={standardisedScale}
            onCheckedChange={(val) => {
              updateSettings({ standardisedScale: val })
              posthog.capture("settings_table_changed", {
                setting: "standardisedScale",
                value: val
              })
            }}
            aria-label="Standardised scale"
          />
        </label>
      </div>
    </>
  )
}

export const TableSettingsLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 lg:flex-row">
      <div className="relative flex h-[200px] w-10/12 flex-col justify-between rounded-lg border-2 p-3 lg:h-[230px] lg:w-[384px]">
        <div className="flex justify-between gap-2 lg:flex-row">
          <Skeleton className="h-[80px] w-[65%] border-none" />
          <Skeleton className="h-[105px] w-[35%]" />
        </div>

        <div className="flex w-full items-baseline justify-between">
          <Skeleton className="h-[16px] w-full" />
          <Skeleton className="ml-2 size-10" />
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-1 md:w-10/12 lg:w-fit">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[48px] w-full py-1 lg:w-[110px]" />
        ))}
        <Skeleton className="col-span-2 h-[48px] w-full" />
      </div>
    </div>
  )
}

export default TableSettings
