"use client"

import { useBoundState } from "@/state/bound-state"
import { Calendar } from "lucide-react"
import { toast } from "sonner"

import { getIcs } from "@/lib/get-ics"
import { Button } from "@/components/ui/button"

export default function StarsDownloadIcsButton() {
  const { coursesToIndex } = useBoundState()

  function handleClick() {
    const formattedCourses: { [moduleKey: string]: string } = {}

    // Temporary for coursesToIndex
    Object.entries(coursesToIndex).forEach(([course, index]) => {
      formattedCourses[course] = index[0].key
    })

    if (Object.keys(formattedCourses).length === 0) {
      toast.info("Please fill up your timetable first")
      return
    }

    const ics = getIcs(formattedCourses)

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
    <Button variant="outline" onClick={handleClick}>
      <span className="hidden md:block">Save to Calendar</span>
      <Calendar className="h-4 w-4 md:ml-1" />
    </Button>
  )
}
