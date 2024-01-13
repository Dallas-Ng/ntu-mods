"use client"

import Link from "next/link"
import { C_DATA } from "@/data/consolidated-2023-2"
import { useBoundState } from "@/state/bound-state"

import { DAY_TRUN_MAP } from "@/config/stars"
import { formatRemarks, formatTitle } from "@/lib/format"
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
          <td className="w-min p-1 md:w-[75px]">Course</td>
          <td className="hidden text-left md:table-cell">Title</td>
          <td>AU</td>

          <td className="p-1">Index</td>
          <td className="p-1">Type</td>
          <td className="p-1">Group</td>
          <td className="p-1">Day</td>
          <td className="p-1">Time</td>
          <td className="p-1">Remarks</td>
        </tr>
      </thead>

      <tbody>
        {Object.entries(coursesToIndex).map(([course, indexes], courseIdx) =>
          indexes.map((index, idx) => (
            <tr
              key={courseIdx + idx}
              className={cn(courseIdx % 2 == 1 && "bg-accent")}>
              {idx === 0 ? (
                <>
                  <td
                    rowSpan={indexes.length}
                    className={cn("w-min p-1 md:w-[75px]")}>
                    <Link
                      href={`/mods/${course}`}
                      className="transition-colors hover:text-secondary-foreground">
                      {course}
                    </Link>
                  </td>

                  <td
                    rowSpan={indexes.length}
                    className={cn(
                      "hidden p-1 text-left capitalize md:table-cell"
                    )}>
                    <Link
                      href={`/mods/${course}`}
                      className="transition-colors hover:text-secondary-foreground">
                      {formatTitle(C_DATA[course].title)}
                    </Link>
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
              <td className="p-1 md:w-[100px]">{index.time}</td>
              <td className="p-1">{formatRemarks(index.remarks)}</td>
            </tr>
          ))
        )}

        <tr className="border-t">
          <td colSpan={3} className="p-1 pl-4 text-left">
            Total AUs:{" "}
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
