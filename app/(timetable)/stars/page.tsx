import dynamic from "next/dynamic"

import Loading from "@/components/loading"
import CollapseContentButton from "@/components/stars/stars-buttons/collapse-content-button"
import StarsManageButton from "@/components/stars/stars-buttons/stars-manage-button"
import StarsShareButton from "@/components/stars/stars-buttons/stars-share-button"
import TimetableHeader from "@/components/stars/timetable-header"
import TimetableOverview from "@/components/stars/timetable-overview"

const StarsTable = dynamic(() => import("@/components/stars/stars-table"), {
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
        <StarsManageButton />

        <StarsShareButton />

        <div className="ml-auto">
          <CollapseContentButton />
        </div>
      </TimetableHeader>

      <StarsTable />

      <p className="mt-[20px] text-lg font-semibold">Overview</p>

      <div className="mb-[50px] mt-2 overflow-hidden rounded-lg border md:w-[50%]">
        <TimetableOverview />
      </div>
    </>
  )
}
