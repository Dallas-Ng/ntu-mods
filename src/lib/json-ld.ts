import { siteConfig } from "@/config/site"

interface CollectionPageInput {
  name: string
  description: string
  /** Site-relative path, e.g. "/articles". */
  path: string
  items?: { name: string; url: string }[]
}

/** schema.org CollectionPage for hub/list pages; url values must be absolute. */
export const collectionPageJsonLd = ({
  name,
  description,
  path,
  items = []
}: CollectionPageInput) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  description,
  url: `${siteConfig.url}${path}`,
  isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
  ...(items.length > 0 && {
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: item.url
      }))
    }
  })
})
