"use client"

import { useBoundState } from "@/state/bound-state"
import { track } from "@vercel/analytics"
import { Link } from "lucide-react"
import { toast } from "sonner"

import { getQsFromCourseToIndexes } from "@/lib/get-qs-from-course-to-index"
import { BASE_URL } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function StarsShareButton() {
  const { coursesToIndex } = useBoundState()

  const generateShareLink = () => {
    const qsObject = getQsFromCourseToIndexes(coursesToIndex)
    const urlParams = new URLSearchParams(qsObject)
    const shareLink = `${BASE_URL}/share?${urlParams.toString()}`

    // Top level to trigger before as sharing can lead to disconnects
    track("share", { link: shareLink })

    try {
      navigator.share({
        title: "NTU Mods",
        text: "Take a look at my timetable!",
        url: shareLink
      })
    } catch {
      // It means that theres no share functionality
      navigator.clipboard.writeText(shareLink)
      toast("Share link copied to clipboard")
    }
  }

  return (
    <Button onClick={generateShareLink} variant="outline">
      <span className="hidden md:block">Share</span>
      <Link className="h-4 w-4 md:ml-1" />
    </Button>
  )
}
