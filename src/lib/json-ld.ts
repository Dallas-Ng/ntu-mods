/**
 * Every schema.org JSON-LD object the site emits is built here, and rendered
 * through src/astro/components/JsonLd.astro. Pages pass data in; they do not
 * hand-write schema objects or <script> tags.
 */
import { siteConfig } from "@/config/site"

export type JsonLd = Record<string, unknown>

const CONTEXT = "https://schema.org"

/** Site-relative path ("/mods") or an already absolute URL -> absolute URL. */
export const absoluteUrl = (pathOrUrl: string) =>
  pathOrUrl.startsWith("http") ? pathOrUrl : `${siteConfig.url}${pathOrUrl}`

/**
 * JSON.stringify for use inside a <script> tag. Escapes "<" so text such as
 * "</script>" in a title cannot close the tag.
 */
export const serializeJsonLd = (data: JsonLd) =>
  JSON.stringify(data).replace(/</g, "\\u003c")

export const organizationJsonLd = (): JsonLd => ({
  "@context": CONTEXT,
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: absoluteUrl("/logo.png"),
  description:
    "Free, independent timetable planner and module browser for Nanyang Technological University students. Not affiliated with NTU."
})

export const websiteJsonLd = (): JsonLd => ({
  "@context": CONTEXT,
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  description:
    "NTU timetable planner and module browser for Nanyang Technological University students."
})

export const webApplicationJsonLd = ({
  path,
  description,
  name = `${siteConfig.name} Timetable Planner`,
  featureList
}: {
  path: string
  description: string
  name?: string
  featureList?: string[]
}): JsonLd => ({
  "@context": CONTEXT,
  "@type": "WebApplication",
  name,
  url: absoluteUrl(path),
  description,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "SGD" },
  isAccessibleForFree: true,
  ...(featureList && { featureList }),
  publisher: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url
  }
})

export const datasetJsonLd = ({
  name,
  description,
  path,
  keywords,
  dateModified
}: {
  name: string
  description: string
  path: string
  keywords: string[]
  /** ISO date (YYYY-MM-DD). */
  dateModified: string
}): JsonLd => ({
  "@context": CONTEXT,
  "@type": "Dataset",
  name,
  description,
  url: absoluteUrl(path),
  isAccessibleForFree: true,
  keywords,
  creator: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url
  },
  dateModified
})

interface CollectionPageInput {
  name: string
  description: string
  /** Site-relative path, e.g. "/articles". */
  path: string
  items?: { name: string; url: string }[]
}

/** CollectionPage for hub/list pages; item urls must be absolute. */
export const collectionPageJsonLd = ({
  name,
  description,
  path,
  items = []
}: CollectionPageInput): JsonLd => ({
  "@context": CONTEXT,
  "@type": "CollectionPage",
  name,
  description,
  url: absoluteUrl(path),
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

/** Plain page markup for pages with no richer type (policy, changelog, ...). */
export const webPageJsonLd = ({
  name,
  description,
  path,
  type = "WebPage"
}: {
  name: string
  description: string
  path: string
  type?: "WebPage" | "AboutPage" | "ContactPage"
}): JsonLd => ({
  "@context": CONTEXT,
  "@type": type,
  name,
  description,
  url: absoluteUrl(path),
  isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url }
})

/** BreadcrumbList; href is a site-relative path or absolute URL. */
export const breadcrumbListJsonLd = (
  crumbs: { name: string; href: string }[]
): JsonLd => ({
  "@context": CONTEXT,
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map(({ name, href }, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item: absoluteUrl(href)
  }))
})

export const faqPageJsonLd = (
  items: { question: string; answer: string }[]
): JsonLd => ({
  "@context": CONTEXT,
  "@type": "FAQPage",
  mainEntity: items.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer }
  }))
})

export const articleJsonLd = ({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author,
  url
}: {
  headline: string
  description: string
  image: string
  datePublished: string
  dateModified: string
  author: string
  url: string
}): JsonLd => ({
  "@context": CONTEXT,
  "@type": "Article",
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author: { "@type": "Person", name: author },
  mainEntityOfPage: url
})

export const courseJsonLd = ({
  code,
  title,
  description,
  credits
}: {
  code: string
  title: string
  description: string
  credits: string | number
}): JsonLd => ({
  "@context": CONTEXT,
  "@type": "Course",
  name: `${code} ${title}`,
  courseCode: code,
  description,
  numberOfCredits: String(credits),
  provider: {
    "@type": "CollegeOrUniversity",
    name: "Nanyang Technological University",
    sameAs: "https://www.ntu.edu.sg"
  }
})
