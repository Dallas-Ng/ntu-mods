"use client"

import Link from "next/link"
import { TRUN_M_DATA } from "@/data/2023/trun-m-data"

import { getModuleAu } from "@/lib/get-module-au"
import getModuleExam from "@/lib/get-module-exam"
import { getModuleIndexMap } from "@/lib/get-module-index-map"
import { cn } from "@/lib/utils"
import { useTimetable } from "@/hooks/use-timetable"

const TimetableOverview = () => {
  const { timetable } = useTimetable()
  const moduleIndexMap = getModuleIndexMap(timetable)

  const formatTime = (time: string) => time.replace(" ", "")

  return (
    <div className="">
      <table className="table w-full table-fixed text-center text-xs">
        <thead>
          <tr className="border-b">
            <th className="w-fit md:w-[100px]">Index</th>
            <th className="w-fit md:w-[100px]">Module</th>
            <th className="hidden text-left md:table-cell">Title</th>
            <th className="w-fit">AU</th>
            <th className="w-fit">Exams</th>
          </tr>
        </thead>

        <tbody>
          {Object.entries(moduleIndexMap).map(
            ([moduleKey, indexes], moduleIdx) => {
              const moduleTitle = TRUN_M_DATA[moduleKey]
              const au = getModuleAu(moduleKey)
              const exam = getModuleExam(moduleKey)

              return (
                <tr
                  key={moduleIdx}
                  className={cn(moduleIdx % 2 == 1 && "bg-accent")}>
                  <td className="w-fit md:w-[100px]">{indexes[0].key}</td>

                  <td className="w-fit md:w-[100px]">
                    <Link
                      href={`/mods/${moduleKey}`}
                      className="transition-colors hover:text-primary-alt">
                      {moduleKey}
                    </Link>
                  </td>

                  <td className="hidden  text-left md:table-cell">
                    <Link
                      href={`/mods/${moduleKey}`}
                      className="transition-colors hover:text-primary-alt">
                      {moduleTitle}
                    </Link>
                  </td>

                  <td>{au.replace("AU", "")}</td>

                  <td>
                    {exam ? (
                      <>
                        {exam.date} <br />
                        {formatTime(exam.start_time)} to{" "}
                        {formatTime(exam.end_time)}
                      </>
                    ) : (
                      <span className="text-muted-foreground">NA</span>
                    )}
                  </td>
                </tr>
              )
            }
          )}

          <tr className="border-t">
            <td></td>
            <td></td>
            <td className="hidden md:table-cell"></td>
            <td>
              {Object.keys(moduleIndexMap).reduce((acc, module) => {
                const au = getModuleAu(module)

                return acc + (parseInt(au.trim().replace("AU", "")) || 0)
              }, 0)}
              .0 AUs
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export const TimetableOverviewLoading = () => {
  return (
    <table className="table table-fixed text-xs">
      <thead>
        <tr className="border-b">
          <th className="w-fit md:w-[100px]">Index</th>
          <th className="w-fit md:w-[100px]">Module</th>
          <th className="hidden text-left md:table-cell">Title</th>
          <th>AU</th>
          <th>Exams</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td></td>
          <td></td>
          <td className="hidden md:table-cell"></td>
          <td className="text-center">0.0 AUs</td>
        </tr>
      </tbody>
    </table>
  )
}

export default TimetableOverview
