import { Fragment } from "react"
import { ChevronRight } from "lucide-react"
import { BreadcrumbList } from "schema-dts"

import { siteConfig } from "@/config/site"

const appendSlash = (href: string) => (href.startsWith("/") ? href : `/${href}`)

interface BreadcrumbItem {
  name: string // shown in breadcrumbs jsonLD
  href: string
  label: string // shown in ui
}

interface Props {
  breadcrumbs: BreadcrumbItem[]
}

const Breadcrumbs = (props: Props) => {
  const { breadcrumbs = [] } = props
  const jsonLd: BreadcrumbList = {
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map(({ href, name }, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: `${siteConfig.url}${appendSlash(href)}`,
      name
    }))
  }

  return (
    <>
      <script
        id="breadcrumbs-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            ...jsonLd
          })
        }}
      />

      <span className="text-muted-foreground flex max-w-full min-w-0 items-center gap-1 overflow-x-auto pb-1 text-sm whitespace-nowrap">
        {breadcrumbs.map(({ href, label }, idx) => {
          return (
            <Fragment key={href}>
              {idx > 0 && <ChevronRight className="size-4 shrink-0" />}
              <a
                href={href}
                className="hover:text-secondary-foreground max-w-[16rem] shrink-0 truncate sm:max-w-none">
                {label}
              </a>
            </Fragment>
          )
        })}
      </span>
    </>
  )
}

export default Breadcrumbs
