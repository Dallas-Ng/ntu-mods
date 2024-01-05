import React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Loading from "@/components/loading"
import TimetableHeader from "@/components/stars/timetable-header"

const ExamTimetable = dynamic(
  () => import("@/components/stars/exam-timetable"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100px] items-center justify-center">
        <Loading />
      </div>
    )
  }
)

const StarsCopyTimetableButton = dynamic(
  () => import("@/components/stars/stars-buttons/stars-copy-timetable-button"),
  { ssr: false, loading: () => <Skeleton className="h-[40px] w-[137.58px]" /> }
)

const StarsTable = dynamic(() => import("@/components/stars/stars-table"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[576px] items-center justify-center rounded-lg border">
      <Loading />
    </div>
  )
})

const TimetableOverview = dynamic(
  () => import("@/components/stars/timetable-overview"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[150px] items-center justify-center">
        <Loading />
      </div>
    )
  }
)

const CollapseContentButton = dynamic(
  () => import("@/components/stars/stars-buttons/collapse-content-button"),
  { ssr: false, loading: () => <Skeleton className="h-10 w-10" /> }
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

      <div className="mb-[50px] mt-2 flex flex-col gap-2 md:flex-row">
        <div className="w-full lg:w-[50%]">
          <h2 className="mb-2">Overview</h2>

          <div className="rounded-lg border">
            <TimetableOverview />
          </div>
        </div>

        <div className="w-full lg:w-[50%]">
          <h2 className="mb-2">Exam Timetable</h2>

          <div className="h-fit rounded-lg border">
            <ExamTimetable />
          </div>
        </div>
      </div>
    </>
  )
}
