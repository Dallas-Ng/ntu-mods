import React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Loading from "@/components/loading"
import TimetableHeader from "@/components/stars/timetable-header"

const StarsCopyTimetableButton = dynamic(
  () => import("@/components/stars/stars-buttons/stars-copy-timetable-button"),
  { ssr: false, loading: () => <Skeleton className="h-[40px] w-[137.58px]" /> }
)

const StarsTable = dynamic(() => import("@/components/stars/stars-table"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[580px] items-center justify-center rounded-lg border">
      <Loading />
    </div>
  )
})

const TimetableOverview = dynamic(
  () => import("@/components/stars/timetable-overview"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[780px] items-center justify-center">
        <Loading />
      </div>
    )
  }
)

const CollapseContentButton = dynamic(
  () => import("@/components/stars/stars-buttons/collapse-content-button"),
  { ssr: false, loading: () => <Skeleton className="h-[40px] w-[139px]" /> }
)

export default function StarsPage() {
  return (
    <>
      <TimetableHeader variant="share">
        <Link href="/stars">
          <Button>Make My Timetable</Button>
        </Link>

        <StarsCopyTimetableButton />

        <div className="ml-auto">
          <CollapseContentButton />
        </div>
      </TimetableHeader>

      <StarsTable />

      <div className="mb-[50px] mt-2 overflow-hidden rounded-lg border md:w-[50%]">
        <TimetableOverview />
      </div>
    </>
  )
}
