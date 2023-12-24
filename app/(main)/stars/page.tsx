import React from "react"
import dynamic from "next/dynamic"

import Loading from "@/components/loading"
import StarsTableLegend from "@/components/stars-table-legend"

const StarsPlanner = dynamic(() => import("@/components/stars-planner"), {
  ssr: false,
  loading: () => <Loading divClassName="h-[70vh] w-full" /> // update this
})

export default function StarsPage() {
  return (
    <div className=" bg-white dark:bg-slate-950 sm:rounded-2xl sm:border">
      <div className="flex items-baseline justify-between pl-4 pr-5 pt-3">
        <h1 className="bg-gradient-to-r from-blue-800 to-indigo-900 bg-clip-text  text-3xl font-bold text-transparent">
          Stars* Planner
        </h1>

        <StarsTableLegend />
      </div>

      <StarsPlanner />
    </div>
  )
}
