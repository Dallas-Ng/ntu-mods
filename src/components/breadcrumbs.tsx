import { Fragment } from "react"
import Link from "next/link"
import Script from "next/script"
import { ChevronRight } from "lucide-react"
import { jsonLdScriptProps } from "react-schemaorg"
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

  return (
    <>
      <Script
        strategy="afterInteractive"
        id="breadcrumbs-jsonld"
        {...jsonLdScriptProps<BreadcrumbList>({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map(({ href, name }, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            item: `${siteConfig.url}${appendSlash(href)}`,
            name
          }))
        })}
      />

      <span className="flex min-w-0 max-w-full items-center gap-1 overflow-x-auto whitespace-nowrap pb-1 text-sm text-muted-foreground">
        {breadcrumbs.map(({ href, label }, idx) => {
          return (
            <Fragment key={href}>
              {idx > 0 && <ChevronRight className="size-4 shrink-0" />}
              <Link
                href={href}
                className="max-w-[16rem] shrink-0 truncate hover:text-secondary-foreground sm:max-w-none">
                {label}
              </Link>
            </Fragment>
          )
        })}
      </span>
    </>
  )
}

export default Breadcrumbs
