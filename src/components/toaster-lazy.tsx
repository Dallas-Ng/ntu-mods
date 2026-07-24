"use client"

import dynamic from "next/dynamic"

// sonner isn't needed for first paint/hydration on any route, so keep it out
// of the initial script list and load it client-side only once mounted.
const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((mod) => mod.Toaster),
  { ssr: false }
)

export default Toaster
