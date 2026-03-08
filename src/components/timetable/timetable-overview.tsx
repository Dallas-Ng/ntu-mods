"use client"

import Link from "next/link"
import { MODULE_MAP } from "@/data/api/module-map"

import { getModuleIndexMap } from "@/lib/get-module-index-map"
import { cn } from "@/lib/utils"
import { useTimetable } from "@/hooks/use-timetable"

const TimetableOverview = () => {
  const { timetable } = useTimetable()
  const moduleIndexMap = getModuleIndexMap(timetable)

  return (
    <div className="">
      <table className="table w-full table-fixed text-center text-xs">
        <thead>
          <tr className="border-b">
            <th className="w-fit lg:w-[100px]">Index</th>
            <th className="w-fit lg:w-[100px]">Module</th>
            <th className="hidden text-left lg:table-cell">Title</th>
            <th className="w-fit">AU</th>
          </tr>
        </thead>

        <tbody>
          {Object.entries(moduleIndexMap).map(
            ([moduleKey, indexes], moduleIdx) => {
              const entry = MODULE_MAP[moduleKey]
              const moduleTitle = entry?.title ?? ""
              const au = entry?.au ?? "0"

              return (
                <tr
                  key={moduleIdx}
                  className={cn(moduleIdx % 2 == 1 && "bg-muted")}>
                  <td className="w-fit lg:w-[100px]">{indexes[0].key}</td>

                  <td className="w-fit lg:w-[100px]">
                    <Link
                      href={`/mods/${moduleKey}`}
                      className="transition-colors hover:text-primary-alt">
                      {moduleKey}
                    </Link>
                  </td>

                  <td className="hidden text-left lg:table-cell">
                    <Link
                      href={`/mods/${moduleKey}`}
                      className="transition-colors hover:text-primary-alt">
                      {moduleTitle}
                    </Link>
                  </td>

                  <td>{au}</td>
                </tr>
              )
            }
          )}

          <tr className="border-t">
            <td></td>
            <td></td>
            <td className="hidden lg:table-cell"></td>
            <td>
              {Object.keys(moduleIndexMap).reduce((acc, moduleKey) => {
                const au = parseFloat(MODULE_MAP[moduleKey]?.au ?? "0") || 0
                return acc + au
              }, 0).toFixed(1)}{" "}
              AUs
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export const TimetableOverviewLoading = () => {
  return (
    <table className="table table-fixed text-xs opacity-30">
      <thead>
        <tr className="border-b">
          <th className="w-fit lg:w-[100px]">Index</th>
          <th className="w-fit lg:w-[100px]">Module</th>
          <th className="hidden text-left lg:table-cell">Title</th>
          <th>AU</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td></td>
          <td></td>
          <td className="hidden lg:table-cell"></td>
          <td className="text-center">0.0 AUs</td>
        </tr>
      </tbody>
    </table>
  )
}

export default TimetableOverview
