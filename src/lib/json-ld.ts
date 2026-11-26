/**
 * Every schema.org JSON-LD object the site emits is built here, and rendered
 * through src/astro/components/JsonLd.astro. Pages pass data in; they do not
 * hand-write schema objects or <script> tags.
 */
import { siteConfig } from "@/config/site"
import { getModuleUrl, getModuleVersionUrl } from "@/lib/module-url"

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

const organization = {
  "@type": "Organization",
  "@id": absoluteUrl("/#organization"),
  name: siteConfig.name,
  url: siteConfig.url
}

const website = {
  "@type": "WebSite",
  "@id": absoluteUrl("/#website"),
  name: siteConfig.name,
  url: siteConfig.url
}

export const organizationJsonLd = (): JsonLd => ({
  "@context": CONTEXT,
  ...organization,
  logo: absoluteUrl("/logo.png"),
  description:
    "Free, independent timetable planner and module browser for Nanyang Technological University students. Not affiliated with NTU."
})

export const websiteJsonLd = (): JsonLd => ({
  "@context": CONTEXT,
  ...website,
  publisher: organization,
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
  publisher: organization
})

interface DatasetInput {
  name: string
  description: string
  path: string
  source?: string
  downloads: { name: string; url: string }[]
}

const dataset = ({
  name,
  description,
  path,
  source,
  downloads
}: DatasetInput): JsonLd => ({
  "@type": "Dataset",
  "@id": absoluteUrl(path),
  name,
  description,
  url: absoluteUrl(path),
  isAccessibleForFree: true,
  publisher: organization,
  ...(source && { isBasedOn: source }),
  distribution: downloads.map(({ name, url }) => ({
    "@type": "DataDownload",
    name,
    contentUrl: absoluteUrl(url),
    encodingFormat: "application/json"
  }))
})

export const datasetJsonLd = (input: DatasetInput): JsonLd => ({
  "@context": CONTEXT,
  ...dataset(input)
})

export const dataCatalogJsonLd = ({
  name,
  description,
  path,
  datasets
}: {
  name: string
  description: string
  path: string
  datasets: DatasetInput[]
}): JsonLd =>
  webPageJsonLd({
    name,
    description,
    path,
    mainEntity: {
      "@type": "DataCatalog",
      "@id": absoluteUrl(`${path}#catalog`),
      name,
      description,
      publisher: organization,
      dataset: datasets.map(dataset)
    }
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
  isPartOf: website,
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
  type = "WebPage",
  mainEntity
}: {
  name: string
  description: string
  path: string
  type?: "WebPage" | "AboutPage" | "ContactPage"
  mainEntity?: JsonLd
}): JsonLd => ({
  "@context": CONTEXT,
  "@type": type,
  name,
  description,
  url: absoluteUrl(path),
  isPartOf: website,
  ...(mainEntity && { mainEntity })
})

export const campusMapJsonLd = ({
  name,
  description,
  path
}: {
  name: string
  description: string
  path: string
}): JsonLd =>
  webPageJsonLd({
    name,
    description,
    path,
    mainEntity: {
      "@type": "Map",
      "@id": absoluteUrl(`${path}#map`),
      name,
      description,
      url: absoluteUrl(path),
      publisher: organization,
      about: {
        "@type": "Place",
        "@id": absoluteUrl(`${path}#campus`),
        name: "Nanyang Technological University campus"
      }
    }
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
  author:
    author === siteConfig.name
      ? organization
      : { "@type": "Person", name: author },
  publisher: organization,
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
}): JsonLd => {
  const url = absoluteUrl(getModuleUrl(code))
  const units = Number(credits)
  const numberOfCredits = Number.isInteger(units)
    ? units
    : { "@type": "QuantitativeValue", value: units, unitText: "Academic units" }

  return {
    "@context": CONTEXT,
    "@type": "Course",
    "@id": `${url}#course`,
    url,
    mainEntityOfPage: url,
    name: title,
    courseCode: code,
    description,
    ...(String(credits).trim() &&
      Number.isFinite(units) &&
      units >= 0 && { numberOfCredits }),
    provider: {
      "@type": "CollegeOrUniversity",
      name: "Nanyang Technological University",
      sameAs: "https://www.ntu.edu.sg"
    }
  }
}

export const courseInstanceJsonLd = ({
  code,
  year,
  semester,
  name
}: {
  code: string
  year: string
  semester: string
  name: string
}): JsonLd => {
  const url = absoluteUrl(getModuleVersionUrl(code, year, semester))
  return {
    "@context": CONTEXT,
    "@type": "CourseInstance",
    "@id": `${url}#offering`,
    url,
    name,
    mainEntityOfPage: url,
    "@reverse": {
      hasCourseInstance: {
        "@type": "Course",
        "@id": absoluteUrl(`${getModuleUrl(code)}#course`),
        courseCode: code
      }
    }
  }
}
