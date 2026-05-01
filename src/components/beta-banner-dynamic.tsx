"use client"

import dynamic from "next/dynamic"

const BetaBanner = dynamic(() => import("@/components/beta-banner"), {
  ssr: false
})

export default BetaBanner
