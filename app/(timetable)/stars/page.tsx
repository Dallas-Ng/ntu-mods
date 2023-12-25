import dynamic from "next/dynamic"

import Loading from "@/components/loading"
import StarsManageButton from "@/components/stars-buttons/stars-manage-button"
import StarsShareButton from "@/components/stars-buttons/stars-share-button"
import TimetableHeader from "@/components/timetable-header"

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
        <StarsManageButton />

        <StarsShareButton />
      </TimetableHeader>

      <StarsTable />
    </>
  )
}
