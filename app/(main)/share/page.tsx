import React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import Loading from "@/components/loading"
import StarsTableLegend from "@/components/stars-table-legend"

const StarsTable = dynamic(() => import("@/components/stars-table"), {
  ssr: false,
  loading: () => <Loading divClassName="h-[70vh] w-full" /> // update this
})

const StarsCopyTimetableButton = dynamic(
  () => import("@/components/stars-buttons/stars-copy-timetable-button"),
  { ssr: false }
)

export default function StarsPage() {
  return (
    <div className="bg-white dark:bg-slate-950 sm:rounded-2xl sm:border ">
      <div className="flex items-baseline justify-between pl-4 pr-5 pt-3">
        <h1 className="bg-gradient-to-r from-emerald-800 to-green-900 bg-clip-text  text-3xl font-bold text-transparent">
          Stars* Planner (Shared)
        </h1>

        <StarsTableLegend />
      </div>

      <div className="flex gap-2 px-2 py-4">
        <Link href="/stars">
          <Button>Create Your Own</Button>
        </Link>

        <StarsCopyTimetableButton />
      </div>

      <StarsTable />
    </div>
  )
}
