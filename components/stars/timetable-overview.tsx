"use client"

import { useBoundState } from "@/state/bound-state"

import { DAY_TRUN_MAP } from "@/config/stars"
import { C_DATA } from "@/lib/consolidated-data"
import { formatRemarks, formatTitle } from "@/lib/stars.lib"
import { cn } from "@/lib/utils"
import { useQueryStringCTI } from "@/hooks/use-qs-CTI"

export default function TimetableOverview() {
  const coursesToIndexFromQueryString = useQueryStringCTI()
  const coursesToIndexFromState = useBoundState().coursesToIndex

  let coursesToIndex =
    Object.keys(coursesToIndexFromQueryString).length > 0
      ? coursesToIndexFromQueryString
      : coursesToIndexFromState

  return (
    <table className="table w-full text-center text-xs">
      <thead>
        <tr className="border-b text-secondary">
          <td className="w-min p-1 text-left md:w-[75px] md:p-2">Course</td>
          <td className="hidden text-left md:table-cell">Title</td>
          <td>AU</td>

          <td>Index</td>
          <td>Type</td>
          <td>Group</td>
          <td>Day</td>
          <td>Time</td>
          <td>Remarks</td>
        </tr>
      </thead>

      <tbody>
        {Object.entries(coursesToIndex).map(([course, indexes], courseIdx) =>
          indexes.map((index, idx) => (
            <tr
              key={courseIdx + idx}
              className={cn(courseIdx % 2 == 1 && "bg-secondary")}>
              {idx === 0 ? (
                <>
                  <td
                    rowSpan={indexes.length}
                    className="w-min p-1 text-left md:w-[75px] md:p-2">
                    {course}

                    <p className="w-min text-left capitalize md:hidden">
                      {formatTitle(C_DATA[course].title)}
                    </p>
                  </td>

                  <td
                    rowSpan={indexes.length}
                    className="hidden p-1 text-left capitalize md:table-cell">
                    {formatTitle(C_DATA[course].title)}
                  </td>

                  <td rowSpan={indexes.length} className="p-1">
                    {C_DATA[course].au.replace("AU", "")}
                  </td>

                  <td rowSpan={indexes.length} className="p-1">
                    {index.key}
                  </td>
                </>
              ) : (
                <></>
              )}

              <td className="p-1">
                {index.type.includes("LEC") ? "LEC" : index.type}
              </td>
              <td className="p-1">{index.group}</td>
              <td className="p-1">{DAY_TRUN_MAP[index.day]}</td>
              <td className="p-1">{index.time}</td>
              <td className="w-min p-1">{formatRemarks(index.remarks)}</td>
            </tr>
          ))
        )}

        <tr className="border-t">
          <td colSpan={2} className="p-1 text-left md:p-2">
            Total AUs
          </td>
          <td colSpan={2} className="text-left">
            {Object.keys(coursesToIndex).reduce(
              (acc, course) =>
                acc +
                (parseInt(C_DATA[course].au.trim().replace("AU", "")) || 0),
              0
            )}
            .0 AUs
          </td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
    </table>
  )
}
