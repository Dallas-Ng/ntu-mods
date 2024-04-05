"use client"

import { Fragment, useEffect, useRef } from "react"
import Link from "next/link"
import { useGrid, useVirtualizer } from "@virtual-grid/react"

import { MODULE_CATEGORY } from "@/lib/constants"
import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleFaculty } from "@/lib/get-module-faculty"
import { useSettings } from "@/hooks/use-settings"

interface Props {
  filteredModules: [string, Module][]
}

const ModuleCardList = ({ filteredModules = [] }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const { isMobile } = useSettings()

  const grid = useGrid({
    scrollRef: ref,
    count: filteredModules.length,
    columns: isMobile ? 1 : 3,
    gap: 12,
    size: { height: 110 }
  })

  const rowVirtualizer = useVirtualizer(grid.rowVirtualizer)
  const columnVirtualizer = useVirtualizer(grid.columnVirtualizer)

  useEffect(() => {
    rowVirtualizer.measure()
  }, [rowVirtualizer, grid.virtualItemHeight])

  useEffect(() => {
    columnVirtualizer.measure()
  }, [columnVirtualizer, grid.virtualItemWidth])

  return (
    <div
      ref={ref}
      className="max-h-[60vh] overflow-auto rounded-md border-2 p-2">
      <div
        style={{
          position: "relative",
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: `${columnVirtualizer.getTotalSize()}px`
        }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <Fragment key={virtualRow.key}>
            {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
              const item = grid.getVirtualItem({
                row: virtualRow,
                column: virtualColumn
              })

              if (!item) return null

              const [code, moduleData] = filteredModules[item.index]

              return (
                <div key={virtualColumn.key} style={item.style}>
                  <Link key={virtualColumn.key} href={`/mods/${code}`}>
                    <div className="h-full w-full rounded-lg border-2 p-3 transition-colors hover:bg-accent">
                      <p className="text-sm text-muted-foreground">
                        {moduleData.code}
                      </p>

                      <p className="truncate">{moduleData.title}</p>

                      <div className="mt-4 flex items-center justify-between text-xs">
                        <div className="flex gap-1 text-muted-foreground">
                          {getModuleCategories(moduleData.searchKeys).map(
                            (category, i) => (
                              <div
                                key={i}
                                className="rounded-full border px-2 py-0">
                                <span key={i}>{MODULE_CATEGORY[category]}</span>
                              </div>
                            )
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {getModuleFaculty(moduleData.searchKeys)}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export default ModuleCardList
