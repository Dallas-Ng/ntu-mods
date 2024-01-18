import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import ModsNotFoundRelatedMods from "@/components/mods/mods-not-found-related-mods"

export default function NotFoundModulePage() {
  return (
    <div className="space-y-5">
      <Link href="/mods">
        <span className="flex cursor-pointer items-center hover:text-secondary-foreground">
          <ArrowLeft className="mr-1 h-5 w-5" /> Click view all mods
        </span>
      </Link>

      <h1 className="text-2xl">This module does not exist.</h1>

      <p className="text-secondary">
        We currently do not support academic years before AY 2023-2024. If this
        is a bug, please contact us.
      </p>

      <ModsNotFoundRelatedMods />
    </div>
  )
}
