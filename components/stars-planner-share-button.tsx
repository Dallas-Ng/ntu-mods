"use client"

import { useBoundState } from "@/state/bound-state"

import { Button } from "./ui/button"
import { useToast } from "./ui/use-toast"

const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://dabao.dallasng.me"

export default function StarsPlannerShareButton() {
  const { coursesToIndex } = useBoundState()
  const { toast } = useToast()

  const generateShareLink = () => {
    const cleanedCoursesToIndex: { [key: string]: string } = {}

    Object.entries(coursesToIndex).forEach(([courseKey, courseVal]) => {
      cleanedCoursesToIndex[courseKey] = courseVal[0].key.toString()
    })

    const url =
      `${BASE_URL}/share?` +
      new URLSearchParams(cleanedCoursesToIndex).toString()

    navigator.clipboard.writeText(url)

    toast({ title: "Copied to clipboard" })
  }

  return (
    <div className="px-2">
      <Button onClick={generateShareLink} variant="secondary">
        Share with Friends
      </Button>
    </div>
  )
}
