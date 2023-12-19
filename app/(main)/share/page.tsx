"use client"

import React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import Loading from "@/components/loading"

const StarsTable = dynamic(() => import("@/components/stars-table"), {
  ssr: false,
  loading: () => <Loading divClassName="h-[70vh] w-full" /> // update this
})

// const StarsCopyTimetableButton = dynamic(
//   () => import("@/components/stars-buttons/stars-copy-timetable-button"),
//   { ssr: false }
// )

export default function StarsPage() {
  return (
    <div className="bg-white dark:bg-slate-950 sm:rounded-2xl sm:border ">
      <h1 className="bg-gradient-to-r from-blue-800 to-indigo-900 bg-clip-text pl-4 pt-3 text-3xl font-bold text-transparent">
        Stars* Planner (Sharing)
      </h1>

      <div className="flex gap-2 px-2 py-4">
        <Link href="/stars">
          <Button>Create Your Own</Button>
        </Link>

        {/* <StarsCopyTimetableButton /> */}
      </div>

      <StarsTable />
    </div>
  )
}
