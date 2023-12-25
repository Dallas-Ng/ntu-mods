import React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import Loading from "@/components/loading"
import TimetableHeader from "@/components/timetable-header"

const StarsCopyTimetableButton = dynamic(
  () => import("@/components/stars-buttons/stars-copy-timetable-button"),
  { ssr: false }
)

const StarsTable = dynamic(() => import("@/components/stars-table"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[780px] items-center justify-center">
      <Loading />
    </div>
  )
})

export default function StarsPage() {
  return (
    <>
      <TimetableHeader>
        <Link href="/stars">
          <Button>Create Your Own</Button>
        </Link>

        <StarsCopyTimetableButton />
      </TimetableHeader>

      <StarsTable />
    </>
  )
}
