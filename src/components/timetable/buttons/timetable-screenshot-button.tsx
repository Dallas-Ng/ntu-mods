"use client"

import { ImageDown } from "lucide-react"
import posthog from "posthog-js"

import { useSearchParams } from "@/hooks/use-search-params"
import ButtonCollapsable from "@/components/button-collapsable"

interface Props {
  persistQuerystring?: boolean // typically used for share page
}

/**
 * Links to the screenshot page
 *
 * @param persistQuerystring - A boolean indicating whether to persist the querystring to the screenshot page.
 */
const StarsScreenshotButton = ({ persistQuerystring }: Props) => {
  let href = `/screenshot`
  const searchParams = useSearchParams()

  if (persistQuerystring) {
    href += `?${searchParams.toString()}`
  }

  return (
    <a
      href={href}
      onClick={() => posthog.capture("timetable_screenshot_clicked")}>
      <ButtonCollapsable icon={ImageDown} text="Export as Image" />
    </a>
  )
}

export default StarsScreenshotButton
