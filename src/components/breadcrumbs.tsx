import { Fragment } from "react"
import { ChevronRight } from "lucide-react"

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
              className="hover:text-secondary-foreground max-w-[16rem] shrink-0 truncate transition-colors sm:max-w-none">
              {label}
            </a>
          </Fragment>
        )
      })}
    </span>
  )
}

export default Breadcrumbs
