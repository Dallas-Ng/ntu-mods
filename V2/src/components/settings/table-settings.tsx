"use client"

import { useState } from "react"
import { M_DATA } from "@/data/2023/m-data"
import { RefreshCcw } from "lucide-react"

import { TRUN_DAY_MAP } from "@/lib/constants"
import { getRandomModuleIndex } from "@/lib/get-random-module-index"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"

import TimetableCell from "../timetable/timetable-cell"
import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"
import { Toggle } from "../ui/toggle"

interface Props {
  toggleBorder?: boolean
}

export default function TableSettings({ toggleBorder = false }: Props) {
  const { settings, updateSettings } = useSettings()
  const { tableCell } = settings
  const [RANDOM_C_INDEX, setRandomCIndex] = useState(getRandomModuleIndex())

  const moduleKey = RANDOM_C_INDEX.randomModuleKey
  const index = RANDOM_C_INDEX.randomIndex

  function reRollIndex() {
    setRandomCIndex(getRandomModuleIndex())
  }

  function updateTableCell(checked: boolean, key: keyof typeof tableCell) {
    updateSettings({ ...settings, tableCell: { ...tableCell, [key]: checked } })
  }

  return (
    <>
      <div
        id="table-settings"
        className="flex flex-col items-center justify-center gap-2 lg:flex-row">
        <div className="relative flex h-[200px] w-10/12 flex-col justify-between rounded-lg border p-3 shadow-lg lg:h-[230px] lg:w-[384px]">
          <div className="flex justify-between gap-0 lg:flex-row">
            <table className="h-min w-[75%]">
              <tbody>
                <tr>
                  <TimetableCell
                    divClassName="h-min w-full cursor-default text-xs"
                    moduleKey={moduleKey}
                    index={index}
                  />
                </tr>
              </tbody>
            </table>

            <table className="h-min w-[35%]">
              <tbody>
                <tr>
                  <TimetableCell
                    divClassName="h-min w-full cursor-default text-xs"
                    moduleKey={moduleKey}
                    index={index}
                  />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex w-full items-baseline justify-between">
            <p className="w-full truncate text-xs capitalize text-secondary">
              {M_DATA[moduleKey].title}
            </p>

            <Button
              onClick={reRollIndex}
              variant="outline"
              size="icon"
              className="ml-2">
              <RefreshCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-1 md:w-10/12 lg:w-fit">
          {Object.keys(tableCell).map((key) => {
            if (["duration"].includes(key)) return

            return (
              <Toggle
                key={key}
                className={cn(
                  "h-fit w-full py-1 lg:w-[110px]",
                  key === "remarks" && "col-span-2 lg:w-full",
                  toggleBorder && "border"
                )}
                pressed={tableCell[key as keyof typeof tableCell]}
                onPressedChange={(val) =>
                  updateTableCell(val, key as keyof typeof tableCell)
                }>
                <div>
                  <p className="capitalize">{key === "key" ? "Index" : key} </p>

                  <span className="text-xs text-secondary">
                    {!["day", "remarks"].includes(key) &&
                      index[key as keyof typeof index]}

                    {key === "day" &&
                      index[key] > 0 &&
                      TRUN_DAY_MAP[index[key]]}

                    {key === "remarks" &&
                      (index[key] === "" ? "No Remarks" : index[key])}
                  </span>
                </div>
              </Toggle>
            )
          })}
        </div>
      </div>
    </>
  )
}

export function TableSettingsSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 lg:flex-row">
      <div className="relative mx-auto flex h-[200px] w-full flex-col justify-between rounded-lg border p-3 shadow-lg md:w-10/12 lg:mx-0 lg:h-[230px] lg:w-[384px]">
        <div className="flex justify-between gap-2 lg:flex-row">
          <Skeleton className="h-[80px] w-[250px]" />
          <Skeleton className="h-[105px] w-[100px]" />
        </div>

        <div className="flex w-full items-baseline justify-between">
          <Skeleton className="h-[16px] w-full" />
          <Skeleton className="ml-2 h-10 w-10" />
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-1 md:w-10/12 lg:w-fit">
        <Skeleton className="h-[48px] w-full md:w-[110px]" />
        <Skeleton className="h-[48px] w-full md:w-[110px]" />
        <Skeleton className="h-[48px] w-full md:w-[110px]" />
        <Skeleton className="h-[48px] w-full md:w-[110px]" />
        <Skeleton className="h-[48px] w-full md:w-[110px]" />
        <Skeleton className="h-[48px] w-full md:w-[110px]" />
        <Skeleton className="col-span-2 h-[48px] w-full" />
      </div>
    </div>
  )
}
