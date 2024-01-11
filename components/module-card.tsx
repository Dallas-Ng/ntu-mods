import Link from "next/link"

import { formatTitle } from "@/lib/stars.lib"
import { cn } from "@/lib/utils"

interface Props {
  module: CourseData
  type?: "default" | "small"
  cardClassName?: string
}

export default function ModuleCard({
  module,
  // type = "default",
  cardClassName
}: Props) {
  return (
    <Link key={module.code} href={`/mods/${module.code}`}>
      <div className={cn("rounded-lg border p-2", cardClassName)}>
        <p className="text-sm text-secondary">{module.code}</p>
        <p className="capitalize">{formatTitle(module.title)}</p>
      </div>
    </Link>
  )
}
