"use client"

import { useBoundState } from "@/state/bound-state"
import { track } from "@vercel/analytics"

import { getQsFromCourseToIndexes } from "@/lib/consolidated-data"
import { BASE_URL } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function StarsShareButton() {
  const { coursesToIndex } = useBoundState()
  const { toast } = useToast()

  const generateShareLink = () => {
    const qsObject = getQsFromCourseToIndexes(coursesToIndex)
    const urlParams = new URLSearchParams(qsObject)
    const shareLink = `${BASE_URL}/share?${urlParams.toString()}`
    navigator.clipboard.writeText(shareLink)
    toast({ title: "Copied to clipboard" })

    track("share", { link: shareLink })
  }

  return (
    <Button onClick={generateShareLink} variant="secondary">
      Share with Friends
    </Button>
  )
}
