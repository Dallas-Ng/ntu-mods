"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ImageDown } from "lucide-react"

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
    <Link href={href}>
      <ButtonCollapsable icon={ImageDown} text="Export as Image" />
    </Link>
  )
}

export const StarsScreenshotButtonLoading = () => (
  <ButtonCollapsable icon={ImageDown} text="Export as Image" disabled />
)

export default StarsScreenshotButton
