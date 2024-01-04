import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"
import Loading from "@/components/loading"
import StarsManageButton from "@/components/stars/stars-buttons/stars-manage-button"
import StarsShareButton from "@/components/stars/stars-buttons/stars-share-button"
import TimetableHeader from "@/components/stars/timetable-header"

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
      <div className="flex h-[780px] items-center justify-center rounded-lg border">
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
      <TimetableHeader>
        <StarsManageButton />

        <div className="ml-auto flex gap-1">
          <StarsShareButton />
          <CollapseContentButton />
        </div>
      </TimetableHeader>

      <StarsTable />

      <div className="mb-[50px] mt-2 overflow-hidden rounded-lg border lg:w-[50%]">
        <TimetableOverview />
      </div>
    </>
  )
}
