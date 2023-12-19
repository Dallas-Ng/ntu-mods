"use client"

import { useBoundState } from "@/state/bound-state"

import { getQsFromCourseToIndexes } from "@/lib/consolidated-data"
import { BASE_URL } from "@/lib/utils"

import { Button } from "../ui/button"
import { useToast } from "../ui/use-toast"

export default function StarsShareButton() {
  const { coursesToIndex } = useBoundState()
  const { toast } = useToast()

  const generateShareLink = () => {
    const qsObject = getQsFromCourseToIndexes(coursesToIndex)
    const urlParams = new URLSearchParams(qsObject)
    navigator.clipboard.writeText(`${BASE_URL}/share?${urlParams.toString()}`)
    toast({ title: "Copied to clipboard" })
  }

  return (
    <Button onClick={generateShareLink} variant="secondary">
      Share with Friends
    </Button>
  )
}
