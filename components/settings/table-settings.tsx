"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound-state"
import { RefreshCcw } from "lucide-react"

import { DAY_TRUN_MAP } from "@/config/stars"
import { C_DATA, getRandomCourseIndex } from "@/lib/consolidated-data"
import { formatTitle } from "@/lib/stars.lib"

import StarsCell from "../stars/stars-cell"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"

export default function TableSettings() {
  const { settings, updateSettings } = useBoundState()
  const { starsCell } = settings
  const [RANDOM_C_INDEX, setRandomCIndex] = useState(getRandomCourseIndex())

  const courseKey = RANDOM_C_INDEX.randomCourseKey
  const index = RANDOM_C_INDEX.randomIndex

  function reRollIndex() {
    setRandomCIndex(getRandomCourseIndex())
  }

  function updateStarsCell(checked: boolean, key: keyof typeof starsCell) {
    updateSettings({ ...settings, starsCell: { ...starsCell, [key]: checked } })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex h-[230px] w-[384px] flex-col justify-between rounded-lg border p-3 shadow-md">
          <div className="flex justify-between gap-2">
            <StarsCell
              className="h-fit w-[250px] text-xs"
              courseKey={courseKey}
              coursesToIndex={{ [courseKey]: [] }}
              index={index}
            />

            <StarsCell
              className="h-fit w-[100px] text-xs"
              courseKey={courseKey}
              coursesToIndex={{ [courseKey]: [] }}
              index={index}
            />
          </div>

          <div className="flex w-full items-baseline justify-between">
            <p className="w-full truncate text-xs capitalize text-gray-500">
              {formatTitle(C_DATA[courseKey].title)}
            </p>

            <Button
              onClick={reRollIndex}
              variant="outline"
              className="ml-2 h-8 w-8 p-0">
              <RefreshCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {Object.keys(starsCell).map((key) => {
            if (["duration"].includes(key)) return

            return (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={key}
                    checked={starsCell[key as keyof typeof starsCell]}
                    onCheckedChange={(val) =>
                      updateStarsCell(val, key as keyof typeof starsCell)
                    }
                  />

                  <Label htmlFor={key} className="capitalize">
                    <span>{key === "key" ? "Index Code" : key} </span>

                    <span className="text-xs text-gray-500">
                      {!["day", "remarks"].includes(key) &&
                        index[key as keyof typeof index]}

                      {key === "day" &&
                        index[key] > 0 &&
                        DAY_TRUN_MAP[index[key]]}

                      {key === "remarks" &&
                        (index[key] === "" ? "No Remarks" : index[key])}
                    </span>
                  </Label>
                </div>
              </>
            )
          })}
        </div>
      </div>

      {/* <div>
        <div className="flex items-center gap-2">
          {Object.entries(COURSE_TYPE).map(([key, value]) => {
            return (
              <div key={key} className="flex items-center gap-1">
                <span className="h-[10px] w-[10px] rounded-full bg-orange-500" />
                <span className="text-xs">{value}</span>
              </div>
            )
          })}

          <div className="flex items-center gap-1">
            <span className="h-[10px] w-[10px] rounded-full bg-orange-500" />
            <span className="text-xs">LEC</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-[10px] w-[10px] rounded-full bg-emerald-500" />
            <span className="text-xs">LAB</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="h-[10px] w-[10px] rounded-full bg-yellow-500" />
            <span className="text-xs">SEM</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="h-[10px] w-[10px] rounded-full bg-blue-500" />
            <span className="text-xs">TUT</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="h-[10px] w-[10px] rounded-full bg-indigo-500" />
            <span className="text-xs">PRJ</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="h-[10px] w-[10px] rounded-full bg-rose-500" />
            <span className="text-xs">DES</span>
          </div>
        </div>
      </div> */}
    </>
  )
}
