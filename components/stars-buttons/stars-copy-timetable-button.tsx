"use client"

import Link from "next/link"

import { getQsFromCourseToIndexes } from "@/lib/consolidated-data"
import { useQueryStringCTI } from "@/hooks/use-qs-CTI"

import { Button } from "../ui/button"

export default function StarsCopyTimetableButton() {
  const coursesToIndex = useQueryStringCTI()

  const createCopyLink = () => {
    const qsObject = getQsFromCourseToIndexes(coursesToIndex)
    const urlParams = new URLSearchParams(qsObject)
    return `/stars?${urlParams.toString()}`
  }

  return (
    <Link href={createCopyLink()}>
      <Button variant="secondary">Copy Timetable</Button>
    </Link>
  )
}
