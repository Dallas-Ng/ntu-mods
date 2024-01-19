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
    <div className="">
      <table className="table w-full table-fixed text-center text-xs">
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
          {Object.entries(moduleIndexMap).map(
            ([module, indexes], moduleIdx) => {
              const moduleData = getModule(module)
              const exam = getModuleExam(module)

              return (
                <tr
                  key={moduleIdx}
                  className={cn(moduleIdx % 2 == 1 && "bg-accent")}>
                  <td className="w-fit md:w-[100px]">{indexes[0].key}</td>

                  <td className="w-fit md:w-[100px]">
                    <Link
                      href={`/mods/${module}`}
                      className="hover:text-hover-primary transition-colors">
                      {module}
                    </Link>
                  </td>

                  <td className="hidden  text-left md:table-cell">
                    <Link
                      href={`/mods/${module}`}
                      className="hover:text-hover-primary transition-colors">
                      {moduleData.title}
                    </Link>
                  </td>

                  <td>{moduleData.au.replace("AU", "")}</td>

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
    </div>
  )
}

export const TimetableOverviewLoading = () => {
  return (
    <table className="table w-full table-fixed border text-center text-xs">
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
          <td>0.0 AUs</td>
        </tr>
      </tbody>
    </table>
  )
}

export default TimetableOverview
