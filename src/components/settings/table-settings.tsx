"use client"

import { useEffect, useState } from "react"
import { RefreshCcw } from "lucide-react"

import { reportError, track } from "@/lib/analytics"
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
      .then((res) => {
        if (!res.ok) throw new Error(`random-samples.json ${res.status}`)
        return res.json()
      })
      .then((data: RandomModuleData[]) => {
        if (data.length > 0) {
          setSamples(data)
          setRandomData(data[rerollKey % data.length])
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) reportError("random_samples_fetch", e)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rerollKey])

  const reRollIndex = () => setRerollKey((k) => k + 1)

  const updateTableCell = (checked: boolean, key: keyof typeof tableCell) => {
    updateSettings({
      ...settings,
      tableCell: { ...tableCell, [key]: checked }
    })
    track("settings_table_changed", { setting: key, value: checked })
  }

  if (!randomData) return <TableSettingsLoading />

  const { code: moduleKey, title, index } = randomData

  return (
    <div className="space-y-3">
      <div
        id="table-settings"
        className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <div
          className={cn(
            "bg-background relative flex h-50 w-full flex-col justify-between rounded-xl p-3 lg:h-57.5 lg:w-96 lg:shrink-0",
            toggleBorder && "border"
          )}>
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

          <div className="flex w-full items-center justify-between gap-2">
            <p className="text-muted-foreground min-w-0 flex-1 truncate text-xs capitalize">
              {title}
            </p>

            <Button
              onClick={reRollIndex}
              variant="ghost"
              size="icon"
              aria-label="Show another module"
              className="shrink-0">
              <RefreshCcw className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 content-start gap-2">
          {(Object.keys(tableCell) as (keyof typeof tableCell)[]).map((key) => {
            if (["duration"].includes(key)) return

            return (
              <Toggle
                key={key}
                className={cn(
                  "bg-background h-14 w-full min-w-0 justify-start rounded-xl px-3 text-left",
                  key === "remarks" && "col-span-2",
                  toggleBorder && "border"
                )}
                pressed={tableCell[key]}
                onPressedChange={(val) => updateTableCell(val, key)}>
                <div className="min-w-0">
                  <p className="leading-tight capitalize">
                    {key === "key" ? "Index" : key}
                  </p>

                  <p className="text-muted-foreground truncate text-xs leading-tight">
                    {!["day", "remarks"].includes(key) && index[key]}

                    {key === "day" &&
                      index[key] > 0 &&
                      (TRUN_DAY_MAP as Record<number, string>)[index[key]]}

                    {key === "remarks" &&
                      (index[key] === "" ? "No Remarks" : index[key])}
                  </p>
                </div>
              </Toggle>
            )
          })}
        </div>
      </div>

      <label
        className={cn(
          "bg-background flex h-28 items-center justify-between gap-4 rounded-xl p-4 sm:h-24",
          toggleBorder && "border"
        )}>
        <span className="min-w-0 space-y-1">
          <p className="text-sm leading-none font-semibold">
            Standardised scale
          </p>
          <span className="text-muted-foreground block text-sm text-pretty">
            Give every 30 min timeslot the same height, sized to fit your
            biggest block, so breaks and lessons are visually comparable.
          </span>
        </span>

        <Switch
          checked={standardisedScale}
          onCheckedChange={(val) => {
            updateSettings({ standardisedScale: val })
            track("settings_table_changed", {
              setting: "standardisedScale",
              value: val
            })
          }}
          aria-label="Standardised scale"
          className="shrink-0"
        />
      </label>
    </div>
  )
}

export const TableSettingsLoading = () => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <Skeleton className="bg-foreground/10 dark:bg-background h-50 w-full rounded-xl lg:h-57.5 lg:w-96 lg:shrink-0" />

        <div className="grid w-full grid-cols-2 content-start gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              key={i}
              className="bg-foreground/10 dark:bg-background h-14 rounded-xl"
            />
          ))}
          <Skeleton className="bg-foreground/10 dark:bg-background col-span-2 h-14 rounded-xl" />
        </div>
      </div>

      <Skeleton className="bg-foreground/10 dark:bg-background h-28 rounded-xl sm:h-24" />
    </div>
  )
}

export default TableSettings
