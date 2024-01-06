"use client"

import { useBoundState } from "@/state/bound-state"

import { DAY_TRUN_MAP } from "@/config/stars"
import { formatRemarks, getIndexTypeStyle } from "@/lib/stars.lib"
import { cn } from "@/lib/utils"

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
  const { settings } = useBoundState()
  const { starsCell } = settings

  const courseStyle = getIndexTypeStyle(index.type)
  const indexProps = useIndexLogic({ courseKey, disableSelect })

  // When a index has multiple variations thats suppose to show in the same cell,
  // e.g. week 1-7 is at LT4, week 9-13 is at LT5...
  const variations = coursesToIndex[courseKey].filter(
    (item) => item.day === index.day && item.time === index.time
  )

  const StarCellData = (index: Index) => (
    <>
      <p>
        <span className={cn("font-bold", courseStyle.text)}>{courseKey}</span>

        {(fullCell || starsCell.type) && <> {index.type}</>}

        {(fullCell || starsCell.group) && <> ({index.group})</>}
      </p>

      <p>
        {(fullCell || starsCell.time) && <>{index.time}</>}

        {(fullCell || starsCell.day) && index.day > 0 && (
          <> {DAY_TRUN_MAP[index.day]}</>
        )}
      </p>

      {(fullCell || starsCell.venue) && <p>{index.venue}</p>}

      {(fullCell || starsCell.remarks) && <p>{formatRemarks(index.remarks)}</p>}

      {(fullCell || starsCell.key) && <p>{index.key}</p>}
    </>
  )

  return (
    <DrawerPopover
      contentClassName="md:w-[350px]"
      openChange={(open) => (open ? indexProps.handleSearch("") : {})}
      trigger={
        <TableCell
          onClick={(e) => disablePopup && e.preventDefault()}
          key={index.key}
          rowSpan={index.duration}
          className={cn(
            "cursor-pointer break-words border border-l-2 border-slate-300 p-1 dark:border-y-slate-800 dark:border-r-slate-800 md:p-2",
            hasConflict && "border-b-2 border-b-red-600 dark:border-b-red-600",
            courseStyle.borderLeft,
            props.className
          )}>
          {variations.length > 1
            ? variations.map((item, key) => (
                <div className="mt-1" key={key}>
                  {StarCellData(item)}
                </div>
              ))
            : StarCellData(index)}
        </TableCell>
      }
      content={
        <IndexCommand
          {...indexProps}
          coursesToIndex={coursesToIndex}
          commandClassName="overflow-y-auto md:max-h-[450px]"
        />
      }
    />
  )
}
