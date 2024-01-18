"use client"

import Link from "next/link"

import { getModule } from "@/lib/get-module"
import getModuleExam from "@/lib/get-module-exam"
import { getModuleIndexMap } from "@/lib/get-module-index-map"
import { cn } from "@/lib/utils"
import { useTimetable } from "@/hooks/use-timetable"

const TimetableOverview = () => {
  const { timetable } = useTimetable()
  const moduleIndexMap = getModuleIndexMap(timetable)

  const formatTime = (time: string) => time.replace(" ", "")

  return (
    <table className="table w-full table-fixed border text-center text-xs">
      <thead>
        <tr className="border-b">
          <th className="w-fit p-1 font-normal text-secondary md:w-[100px]">
            Index
          </th>
          <th className="w-fit p-1 font-normal text-secondary md:w-[100px]">
            Module
          </th>
          <th className="hidden text-left font-normal text-secondary md:table-cell">
            Title
          </th>
          <th className="p-1 font-normal text-secondary">AU</th>
          <th className="p-1 font-normal text-secondary">Exams</th>
        </tr>
      </thead>

      <tbody>
        {Object.entries(moduleIndexMap).map(([module, indexes], moduleIdx) => {
          const moduleData = getModule(module)
          const exam = getModuleExam(module)

          return (
            <tr
              key={moduleIdx}
              className={cn(moduleIdx % 2 == 1 && "bg-accent")}>
              <td className="w-fit p-1 md:w-[100px]">{indexes[0].key}</td>

              <td className="w-fit p-1 md:w-[100px]">
                <Link
                  href={`/mods/${module}`}
                  className="transition-colors hover:text-secondary-foreground">
                  {module}
                </Link>
              </td>

              <td className="hidden p-1 text-left md:table-cell">
                <Link
                  href={`/mods/${module}`}
                  className="transition-colors hover:text-secondary-foreground">
                  {moduleData.title}
                </Link>
              </td>

              <td className="p-1">{moduleData.au.replace("AU", "")}</td>

              <td className="p-1">
                {exam ? (
                  <>
                    {exam.date} <br />
                    {formatTime(exam.start_time)} to {formatTime(exam.end_time)}
                  </>
                ) : (
                  <span className="text-secondary">NA</span>
                )}
              </td>
            </tr>
          )
        })}

        <tr>
          <td></td>
          <td></td>
          <td className="hidden md:table-cell"></td>
          <td className="p-1">
            {Object.keys(moduleIndexMap).reduce((acc, module) => {
              const moduleData = getModule(module)

              return (
                acc + (parseInt(moduleData.au.trim().replace("AU", "")) || 0)
              )
            }, 0)}
            .0 AUs
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export const TimetableOverviewLoading = () => {
  return (
    <table className="table w-full table-fixed border text-center text-xs">
      <thead>
        <tr className="border-b">
          <th className="w-fit p-1 font-normal text-secondary md:w-[100px]">
            Index
          </th>
          <th className="w-fit p-1 font-normal text-secondary md:w-[100px]">
            Module
          </th>
          <th className="hidden text-left font-normal text-secondary md:table-cell">
            Title
          </th>
          <th className="p-1 font-normal text-secondary">AU</th>
          <th className="p-1 font-normal text-secondary">Exams</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td></td>
          <td></td>
          <td className="hidden md:table-cell"></td>
          <td className="p-1">0.0 AUs</td>
        </tr>
      </tbody>
    </table>
  )
}

export default TimetableOverview
