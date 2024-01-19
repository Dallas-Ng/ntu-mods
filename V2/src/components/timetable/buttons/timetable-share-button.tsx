"use client"

import { BASE_URL } from "@/lib/constants"
import { useTimetable } from "@/hooks/use-timetable"
import ShareButton from "@/components/share-button"

const TimetableShareButton = () => {
  const { timetable } = useTimetable()
  const urlParams = new URLSearchParams(timetable)
  const link = `${BASE_URL}/share?${urlParams.toString()}`

  return (
    <ShareButton
      title="Look at my timetable from NTU Mods"
      description="You can use this to plan your mods too!"
      link={link}
    />
  )
}

export const TimetableShareButtonLoading = () => (
  <ShareButton
    title="Look at my timetable from NTU Mods"
    description="You can use this to plan your mods too!"
    link=""
    disabled
  />
)

export default TimetableShareButton
