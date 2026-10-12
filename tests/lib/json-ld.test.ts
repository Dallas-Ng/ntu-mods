import { describe, expect, it } from "vitest"

import {
  absoluteUrl,
  breadcrumbListJsonLd,
  collectionPageJsonLd,
  faqPageJsonLd,
  serializeJsonLd,
  webPageJsonLd
} from "@/lib/json-ld"

describe("absoluteUrl", () => {
  it("prefixes site-relative paths and leaves absolute URLs alone", () => {
    expect(absoluteUrl("/mods")).toBe("https://ntumods.com/mods")
    expect(absoluteUrl("https://example.com/x")).toBe("https://example.com/x")
  })
})

describe("serializeJsonLd", () => {
  it("cannot be closed early by </script> in a value", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)" })
    expect(out).not.toContain("</script>")
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)")
  })
})

describe("builders", () => {
  it("webPageJsonLd defaults to WebPage with an absolute url", () => {
    const ld = webPageJsonLd({ name: "N", description: "D", path: "/privacy" })
    expect(ld["@type"]).toBe("WebPage")
    expect(ld.url).toBe("https://ntumods.com/privacy")
  })

  it("numbers breadcrumb items from 1 with absolute urls", () => {
    const ld = breadcrumbListJsonLd([
      { name: "Home", href: "/" },
      { name: "Articles", href: "/articles" }
    ])
    expect(ld["@type"]).toBe("BreadcrumbList")
    expect(ld.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://ntumods.com/"
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Articles",
        item: "https://ntumods.com/articles"
      }
    ])
  })

  it("omits mainEntity on a CollectionPage with no items", () => {
    const ld = collectionPageJsonLd({
      name: "n",
      description: "d",
      path: "/mods"
    })
    expect(ld).not.toHaveProperty("mainEntity")
  })

  it("maps FAQ items to Question/Answer", () => {
    const ld = faqPageJsonLd([{ question: "Q?", answer: "A." }])
    expect(ld.mainEntity).toEqual([
      {
        "@type": "Question",
        name: "Q?",
        acceptedAnswer: { "@type": "Answer", text: "A." }
      }
    ])
  })
})
