"use client"

import { Calendar } from "lucide-react"
import { toast } from "sonner"

import { getIcs } from "@/lib/get-ics"
import { useTimetable } from "@/hooks/use-timetable"
import ButtonCollapsable from "@/components/button-collapsable"

const TimetableDownloadCalendarButton = () => {
  const { timetable } = useTimetable()

  const handleClick = () => {
    if (Object.keys(timetable).length === 0) {
      toast.info("Please fill up your timetable first")
      return
    }

    const ics = getIcs(timetable)

    if (ics) {
      // downloads the file
      const blob = new Blob([ics], { type: "text/calendar" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = "ntu_mods_timetable.ics"

      document.body.appendChild(a)
      a.click()

      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <ButtonCollapsable
      onClick={handleClick}
      icon={Calendar}
      text="Save to Calendar"
    />
  )
}

export const TimetableDownloadCalendarButtonLoading = () => (
  <ButtonCollapsable icon={Calendar} text="Save to Calendar" disabled />
)

export default TimetableDownloadCalendarButton
