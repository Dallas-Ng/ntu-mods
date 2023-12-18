"use client"

import React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import CONSOLIDATED_DATA from "@/data/consolidated-2023-2.json"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import StarsTable from "@/components/stars-table"

export default function StarsPage() {
  const searchParams = useSearchParams()

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

      <StarsTable coursesToIndex={coursesToIndex} />
    </div>
  )
}
