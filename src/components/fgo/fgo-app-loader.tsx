"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

const FgoApp = dynamic(() => import("./fgo-app"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
})

export default function FgoAppLoader() {
  return <FgoApp />
}
