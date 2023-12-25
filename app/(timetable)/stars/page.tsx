import dynamic from "next/dynamic"

import Loading from "@/components/loading"
import StarsManageButton from "@/components/stars/stars-buttons/stars-manage-button"
import StarsShareButton from "@/components/stars/stars-buttons/stars-share-button"
import TimetableHeader from "@/components/stars/timetable-header"

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
      </TimetableHeader>

      <StarsTable />
    </>
  )
}
