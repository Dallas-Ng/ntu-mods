import Link from "next/link"

import { cn } from "@/lib/utils"

interface Props {
  module: Module
  variant?: "default" | "small"
  cardClassName?: string
}

const ModuleCard = ({ module, cardClassName }: Props) => {
  return (
    <Link key={module.code} href={`/mods/${module.code}`}>
      <div
        className={cn(
          "rounded-lg border bg-card p-2 text-sm text-muted-foreground",
          cardClassName
        )}>
        <p>{module.code}</p>

        <p className="text-foreground">{module.title}</p>
      </div>
    </Link>
  )
}

export default ModuleCard
