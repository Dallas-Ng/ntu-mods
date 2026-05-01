"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

const LandingProduct = dynamic(() => import("./landing-product"), {
  ssr: false,
  loading: () => (
    <div className="bg-background dark:bg-slate-950">
      <Skeleton className="z-[2] h-[59vh] w-full" />
    </div>
  )
})

export default LandingProduct
