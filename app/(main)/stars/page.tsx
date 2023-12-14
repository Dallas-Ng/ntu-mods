import React from "react"
import dynamic from "next/dynamic"

const StarsPlanner = dynamic(() => import("@/components/stars-planner"), {
  ssr: false,
  loading: () => <div>loading..</div> // update this
})

export default function StarsPage() {
  return (
    <div className="bg-white p-1 dark:bg-slate-950 sm:rounded-2xl sm:border">
      <h1 className="bg-gradient-to-r from-blue-800 to-indigo-900 bg-clip-text pl-4 pt-3 text-3xl font-bold text-transparent">
        Stars* Planner
      </h1>

      <StarsPlanner />
    </div>
  )
}
