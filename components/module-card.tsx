import Link from "next/link"

import { formatTitle } from "@/lib/stars.lib"
import { cn } from "@/lib/utils"

interface Props {
  module: CourseData
  variant?: "default" | "small"
  cardClassName?: string
}

export default function ModuleCard({
  module,
  variant = "default",
  cardClassName
}: Props) {
  return (
    <Link key={module.code} href={`/mods/${module.code}`}>
      <div
        className={cn(
          "rounded-lg border p-2 text-sm text-secondary",
          cardClassName
        )}>
        <p>{module.code}</p>

        <p className="capitalize text-foreground">
          {formatTitle(module.title)}
        </p>
      </div>
    </Link>
  )
}
