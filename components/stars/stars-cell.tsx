"use client"

import { useState } from "react"
import { C_DATA } from "@/data/consolidated-2023-2"
import { useBoundState } from "@/state/bound-state"

import { DAY_TRUN_MAP } from "@/config/stars"
import { formatRemarks, getIndexTypeStyle } from "@/lib/stars.lib"
import { cn, sleep } from "@/lib/utils"

import DrawerPopover from "../drawer-popover"
import { TableCell } from "../ui/table"
import IndexCommand from "./stars-buttons/stars-index-button/index-command"
import useIndexLogic from "./stars-buttons/stars-index-button/index-logic"

interface StarsCellProp extends React.HTMLAttributes<HTMLTableCellElement> {
  courseKey: string
  index: Index
  hasConflict?: boolean
  coursesToIndex: { [courseKey: string]: Index[] }
  disablePopup?: boolean
  disableSelect?: boolean
  fullCell?: boolean
}

export default function StarsCell(props: StarsCellProp) {
  const {
    courseKey,
    index,
    hasConflict = false,
    coursesToIndex,
    disablePopup = false,
    disableSelect = false,
    fullCell = false
  } = props
  const { settings, info } = useBoundState()
  const { starsCell } = settings
  const courseStyle = getIndexTypeStyle(index.type)
  const indexProps = useIndexLogic({ courseKey, disableSelect })

  // When a index has multiple variations thats suppose to show in the same cell,
  // e.g. week 1-7 is at LT4, week 9-13 is at LT5...
  const variations = coursesToIndex[courseKey].filter(
    (item) => item.day === index.day && item.time === index.time
  )

  /**
   * This function is to allow shallow update of the coursesToIndex state without
   * setting it into state. When the drawer closes, then we will update the state.
   */
  const [copyCtI, setCopyCtI] = useState(coursesToIndex)
  function handleSelectWithDrawer(idxKey: string) {
    if (!info.mobile) {
      indexProps.handleSelect(idxKey)
      return
    }
    setCopyCtI((pS) => ({
      ...pS,
      // It is safe to assume that the indexKey will always be found
      [courseKey]: Object.values(C_DATA[courseKey].indexes).find(
        (x) => x[0].key === idxKey
      ) as Index[]
    }))
  }

  /**
   * When the drawer is closed, update the coursesToIndex state
   * This exist because each cell is creating its own drawer, which will
   * destory itself if the cell timeslot is changed as its position is changed (hence deleted)
   */
  async function handleDrawerClose() {
    await sleep(400)
    indexProps.handleSelect(copyCtI[courseKey][0].key)
  }

  const StarCellData = (index: Index) => (
    <>
      <p>
        <span className={cn("font-bold", courseStyle.text)}>{courseKey}</span>

        {(fullCell || starsCell.type) && (
          <span className={cn("font-semibold", courseStyle.textAlt)}>
            {" "}
            {index.type.includes("LEC") ? "LEC" : index.type}
          </span>
        )}

        {(fullCell || starsCell.group) && <> ({index.group})</>}
      </p>

      <p>
        {(fullCell || starsCell.time) && <>{index.time}</>}

        {(fullCell || starsCell.day) && index.day > 0 && (
          <> {DAY_TRUN_MAP[index.day]}</>
        )}
      </p>

      <p>
        {(fullCell || starsCell.venue) && <>{index.venue}</>}

        {(fullCell || starsCell.remarks) && index.remarks !== "" && (
          <> - {formatRemarks(index.remarks)}</>
        )}
      </p>

      {(fullCell || starsCell.key) && <p>{index.key}</p>}
    </>
  )

  return (
    <DrawerPopover
      contentClassName="md:w-[350px]"
      openChange={(open) => (open ? indexProps.handleSearch("") : {})}
      onClose={handleDrawerClose}
      trigger={
        <TableCell
          onClick={(e) => disablePopup && e.preventDefault()}
          key={index.key}
          rowSpan={index.duration}
          className={cn(
            "h-full cursor-pointer break-words p-0",
            props.className
          )}>
          <div className="flex h-full w-full p-1">
            <div
              className={cn(
                "flex h-full flex-1 flex-col items-center justify-center rounded-lg p-1 transition-colors md:px-3",
                courseStyle.background
              )}>
              <div className="w-full">
                {variations.length > 1
                  ? variations.map((item, key) => (
                      <div className="mt-1" key={key}>
                        {StarCellData(item)}
                      </div>
                    ))
                  : StarCellData(index)}
              </div>
            </div>
          </div>
        </TableCell>
      }
      content={
        <IndexCommand
          handleSelect={handleSelectWithDrawer}
          handleSearch={indexProps.handleSearch}
          filteredIndexes={indexProps.filteredIndexes}
          coursesToIndex={copyCtI}
          commandClassName="overflow-y-auto md:max-h-[450px]"
        />
      }
    />
  )
}
