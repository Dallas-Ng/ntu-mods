"use client"

import { useBoundState } from "@/state/bound-state"
import { track } from "@vercel/analytics"
import { Link } from "lucide-react"
import { toast } from "sonner"

import { getQsFromCourseToIndexes } from "@/lib/get-qs-from-course-to-index"
import { BASE_URL, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Props {
  coursesToIndex?: { [courseKey: string]: Index[] }
  shareInfo?: {
    title: string
    text: string
  }
  path?: "share" | "screenshot"
  hideText?: boolean
}

export default function StarsShareButton(props: Props) {
  const {
    path = "share",
    shareInfo = { title: "NTU Mods", text: "Take a look at my timetable!" },
    hideText = true
  } = props
  const stateCTI = useBoundState().coursesToIndex
  const coursesToIndex = props.coursesToIndex ?? stateCTI


  const generateShareLink = () => {
    const qsObject = getQsFromCourseToIndexes(coursesToIndex)
    const urlParams = new URLSearchParams(qsObject)
    const shareLink = `${BASE_URL}/${path}?${urlParams.toString()}`

    // Top level to trigger before as sharing can lead to disconnects
    track("share", { link: shareLink })

    try {
      navigator.share({
        ...shareInfo,
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
      <span className={cn(hideText && "hidden md:block")}>Share</span>
      <Link className={cn("h-4 w-4 md:ml-1", !hideText && "ml-1")} />
    </Button>
  )
}
