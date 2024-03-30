import { Fragment } from "react"
import Link from "next/link"
import Script from "next/script"
import { ChevronRight } from "lucide-react"
import { jsonLdScriptProps } from "react-schemaorg"
import { BreadcrumbList } from "schema-dts"

import { siteConfig } from "@/config/site"

const appendSlash = (href: string) => (href.startsWith("/") ? href : `/${href}`)

interface Props {
  breadcrumbs: {
    name: string // shown in breadcrumbs jsonLD
    href: string
    label: string // shown in ui
  }[]
}

const Breadcrumbs = (props: Props) => {
  const { breadcrumbs = [] } = props

  return (
    <>
      <Script
        strategy="beforeInteractive"
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

      <span className="flex items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbs.map(({ href, label }, idx) => {
          return (
            <Fragment key={href}>
              {idx > 0 && <ChevronRight className="size-4" />}
              <Link href={href} className="hover:text-secondary-foreground">
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
