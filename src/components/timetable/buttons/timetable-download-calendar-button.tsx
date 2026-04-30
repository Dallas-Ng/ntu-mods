"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"
import { toast } from "sonner"

import { useLatestSemester } from "@/hooks/use-latest-semester"
import { useTimetable } from "@/hooks/use-timetable"
import ButtonCollapsable from "@/components/button-collapsable"

const TimetableDownloadCalendarButton = () => {
  const { timetable } = useTimetable()
  const { year, semester } = useLatestSemester()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (Object.keys(timetable).length === 0) {
      toast.info("Please fill up your timetable first")
      return
    }

    setLoading(true)

    const params = new URLSearchParams(timetable)
    params.append("year", year)
    params.append("semester", semester)

    await fetch(`/api/ics?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    })
      .then((res) => {
        if (res.ok) {
          res.json().then((data: { icsText: string }) => {
            const { icsText } = data
            const blob = new Blob([icsText], { type: "text/calendar" })
            const url = URL.createObjectURL(blob)

            const a = document.createElement("a")
            a.href = url
            a.download = "ntu_mods_timetable.ics"

            document.body.appendChild(a)
            a.click()

            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          })
        } else {
          throw new Error("Missing Response")
        }
      })
      .catch(() => {
        toast.error("Something went wrong, please try again later")
      })

    setLoading(false)
  }

  return (
    <ButtonCollapsable
      onClick={handleClick}
      disabled={loading}
      icon={Calendar}
      text="Save to Calendar"
    />
  )
}

export const TimetableDownloadCalendarButtonLoading = () => (
  <ButtonCollapsable icon={Calendar} text="Save to Calendar" disabled />
)

export default TimetableDownloadCalendarButton
