"use client"

import { useBoundState } from "@/state/bound-state"
import { PopoverTrigger } from "@radix-ui/react-popover"

import { DAY_TRUN_MAP } from "@/config/stars"
import { formatRemarks, getIndexTypeStyle } from "@/lib/stars.lib"
import { cn } from "@/lib/utils"

import { Popover, PopoverContent } from "../ui/popover"
import { TableCell } from "../ui/table"
import IndexCommand from "./stars-buttons/stars-index-button/index-command"
import useIndexLogic from "./stars-buttons/stars-index-button/index-logic"

interface StarsCellProp extends React.HTMLAttributes<HTMLTableCellElement> {
  courseKey: string
  index: Index
  hasConflict?: boolean
  coursesToIndex: { [courseKey: string]: Index[] }
}

export default function StarsCell(props: StarsCellProp) {
  const { courseKey, index, hasConflict = false, coursesToIndex } = props
  const { settings } = useBoundState()
  const { collapsedView, starsCell } = settings

  const courseStyle = getIndexTypeStyle(index.type)
  const indexProps = useIndexLogic({ courseKey })

  // When a index has multiple variations thats suppose to show in the same cell,
  // e.g. week 1-7 is at LT4, week 9-13 is at LT5...
  const variations = coursesToIndex[courseKey].filter(
    (item) => item.day === index.day && item.time === index.time
  )

  const StarCellWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <Popover>
        <PopoverTrigger type={undefined} asChild>
          <TableCell
            key={index.key}
            rowSpan={index.duration}
            className={cn(
              "cursor-pointer break-words border border-l-2 border-slate-300 p-1 dark:border-y-slate-800 dark:border-r-slate-800 md:p-2",
              hasConflict &&
                "border-b-2 border-b-red-600 dark:border-b-red-600",
              courseStyle.borderLeft,
              props.className
            )}>
            {children}
          </TableCell>
        </PopoverTrigger>

        <PopoverContent className="max-h-[450px] w-[400px] overflow-auto p-1">
          <IndexCommand {...indexProps} />
        </PopoverContent>
      </Popover>
    )
  }

  const StarCellData = (index: Index) => (
    <>
      <p>
        <span className={cn("font-bold", courseStyle.text)}>{courseKey}</span>

        {starsCell.type && <> {index.type}</>}

        {starsCell.group && <> ({index.group})</>}
      </p>

      <p>
        {!collapsedView && starsCell.time && <>{index.time}</>}

        {!collapsedView && starsCell.day && index.day > 0 && (
          <> {DAY_TRUN_MAP[index.day]}</>
        )}
      </p>

      {starsCell.venue && <p>{index.venue}</p>}

      {starsCell.remarks && <p>{formatRemarks(index.remarks)}</p>}

      {!collapsedView && starsCell.key && <p>{index.key}</p>}
    </>
  )

  if (variations.length > 1) {
    return (
      <StarCellWrapper>
        {variations.map((item, key) => (
          <div className="mt-1" key={key}>
            {StarCellData(item)}
          </div>
        ))}
      </StarCellWrapper>
    )
  }

  return <StarCellWrapper>{StarCellData(index)}</StarCellWrapper>
}
