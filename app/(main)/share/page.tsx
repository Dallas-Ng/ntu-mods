"use client"

import React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import CONSOLIDATED_DATA from "@/data/consolidated-2023-2.json"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import StarsTable from "@/components/stars-table"

export default function StarsPage() {
  const searchParams = useSearchParams()

  function detectMob() {
    const toMatch = [
      /Android/i,
      /webOS/i,
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /BlackBerry/i,
      /Windows Phone/i
    ]

    return toMatch.some((toMatchItem) => {
      return navigator.userAgent.match(toMatchItem)
    })
  }

  const coursesToIndex: CourseIndex = {}

  searchParams.forEach((value, key) => {
    const course = CONSOLIDATED_DATA[key as keyof typeof CONSOLIDATED_DATA]
    const indexes = course.indexes[value as keyof typeof course.indexes]
    coursesToIndex[key] = indexes
  })

  return (
    <div className="bg-white dark:bg-slate-950 sm:rounded-2xl sm:border ">
      <h1 className="bg-gradient-to-r from-blue-800 to-indigo-900 bg-clip-text pl-4 pt-3 text-3xl font-bold text-transparent">
        Stars* Planner (Sharing)
      </h1>

      <div className="px-2 py-4">
        <Link href="/stars">
          <Button>Create your own timetable</Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <div
          className={cn(
            detectMob() ? "w-[calc(100vw*2)] overflow-x-auto" : "w-full"
          )}>
          <StarsTable coursesToIndex={coursesToIndex} />
        </div>
      </div>
    </div>
  )
}
