import { Fragment } from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  href: string
  label: string
}

interface Props {
  breadcrumbs: BreadcrumbItem[]
}

const Breadcrumbs = (props: Props) => {
  const { breadcrumbs = [] } = props
  return (
    <span className="text-muted-foreground flex max-w-full min-w-0 items-center gap-1 overflow-x-auto pb-1 text-sm whitespace-nowrap">
      {breadcrumbs.map(({ href, label }, idx) => {
        return (
          <Fragment key={href}>
            {idx > 0 && <ChevronRight className="size-4 shrink-0" />}
            <a
              href={href}
              className={cn(
                "hover:text-secondary-foreground truncate transition-colors",
                // The last crumb is the page title: let it shrink to the space
                // left (ellipsised) instead of running off the screen.
                idx === breadcrumbs.length - 1 ? "min-w-0" : "shrink-0"
              )}>
              {label}
            </a>
          </Fragment>
        )
      })}
    </span>
  )
}

export default Breadcrumbs
