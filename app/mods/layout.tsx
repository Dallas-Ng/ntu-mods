import { Metadata } from "next"

import { siteConfig } from "@/config/site"
import LayoutDefault from "@/components/layout-default"

export const metadata: Metadata = {
  title: siteConfig.metatags.mods.title,
  description: siteConfig.metatags.mods.desc,
  alternates: { canonical: "/mods" }
}

interface Props {
  children?: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <>
      <LayoutDefault>{children}</LayoutDefault>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: siteConfig.metatags.mods.title,
              description: siteConfig.metatags.mods.desc,
              url: `${siteConfig.url}/mods`
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: siteConfig.url
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Mods",
                  item: `${siteConfig.url}/mods`
                }
              ]
            }
          ])
        }}
      />
    </>
  )
}
