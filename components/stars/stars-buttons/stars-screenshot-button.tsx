"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ImageDown } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Props {
  persistQuerystring?: boolean
}

export default function StarsScreenshotButton({
  persistQuerystring
}: Props = {}) {
  let href = `/screenshot`
  const searchParams = useSearchParams()

  if (persistQuerystring) {
    href += `?${searchParams.toString()}`
  }

  return (
    <Link href={href}>
      <Button variant="outline">
        <span className="hidden md:block">Export as Image</span>
        <ImageDown className="h-5 w-5 md:ml-1" />
      </Button>
    </Link>
  )
}
