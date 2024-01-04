"use client"

import { useBoundState } from "@/state/bound-state"
import { track } from "@vercel/analytics"
import { Link } from "lucide-react"
import { toast } from "sonner"

import { getQsFromCourseToIndexes } from "@/lib/consolidated-data"
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

    if (navigator.canShare()) {
      navigator.share({
        title: document.title,
        text: "Take a look at my timetable!",
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(shareLink)
      toast("Share link copied to clipboard")
    }
  }

  return (
    <Button onClick={generateShareLink} variant="outline" size="icon">
      <Link className="h-4 w-4" />
    </Button>
  )
}
