import Link from "next/link"
import { ImageDown } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function StarsScreenshotButton() {
  return (
    <Link href="/screenshot">
      <Button variant="outline">
        <span className="hidden md:block">Export as Image</span>
        <ImageDown className="h-5 w-5 md:ml-1" />
      </Button>
    </Link>
  )
}
