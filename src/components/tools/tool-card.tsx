import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface Props {
  title: string
  description: string
  href: string
  icon: LucideIcon
  badge?: string
}

export default function ToolCard({
  title,
  description,
  href,
  icon: Icon,
  badge
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border p-5 transition-colors",
        "hover:bg-muted/50 hover:border-foreground/20"
      )}>
      <div className="flex items-start justify-between">
        <div className="group-hover:bg-background rounded-lg border p-2 transition-colors">
          <Icon className="size-5" />
        </div>
        {badge && (
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </Link>
  )
}
