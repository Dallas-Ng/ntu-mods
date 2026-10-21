"use client"

import { ImageDown } from "lucide-react"

import { track } from "@/lib/analytics"
import { useSearchParams } from "@/hooks/use-search-params"
import ButtonCollapsable from "@/components/button-collapsable"

interface Props {
  persistQuerystring?: boolean // typically used for share page
  /** Show the label on phones too, stretching to share the row. */
  labelled?: boolean
}

/**
 * Links to the screenshot page
 *
 * @param persistQuerystring - A boolean indicating whether to persist the querystring to the screenshot page.
 */
const StarsScreenshotButton = ({ persistQuerystring, labelled }: Props) => {
  let href = `/screenshot`
  const searchParams = useSearchParams()

  if (persistQuerystring) {
    href += `?${searchParams.toString()}`
  }

  return (
    <a
      href={href}
      onClick={() => track("timetable_screenshot_clicked")}
      className={labelled ? "flex-1 sm:flex-none" : undefined}>
      <ButtonCollapsable
        icon={ImageDown}
        text={
          labelled ? (
            <>
              <span className="sm:hidden">Save image</span>
              <span className="hidden sm:inline">Export as Image</span>
            </>
          ) : (
            "Export as Image"
          )
        }
        aria-label="Export as Image"
        labelled={labelled}
        className={labelled ? "w-full sm:w-auto" : undefined}
      />
    </a>
  )
}

export default StarsScreenshotButton
