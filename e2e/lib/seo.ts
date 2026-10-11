import type { Page } from "@playwright/test"

import { SITE, type PageRef } from "./urls"

export interface SeoSnapshot {
  title: string
  lang: string | null
  metas: [key: string, content: string][]
  canonicals: string[]
  jsonld: string[]
  headings: { level: number; text: string }[]
  imgs: {
    src: string
    alt: string | null
    w: string | null
    h: string | null
  }[]
  hrefs: { href: string; rel: string }[]
  insecure: string[]
  hreflangs: number
  text: string
}

/** One DOM pass; run it with JS disabled to see exactly what crawlers get. */
export const readSeo = (page: Page): Promise<SeoSnapshot> =>
  page.evaluate(() => {
    const all = <T extends Element>(sel: string) =>
      Array.from(document.querySelectorAll<T>(sel))
    return {
      title: document.title,
      lang: document.documentElement.getAttribute("lang"),
      metas: all("meta").map((m) => [
        m.getAttribute("name") ?? m.getAttribute("property") ?? "",
        m.getAttribute("content") ?? ""
      ]) as [string, string][],
      canonicals: all("link[rel=canonical]").map(
        (l) => l.getAttribute("href") ?? ""
      ),
      jsonld: all('script[type="application/ld+json"]').map(
        (s) => s.textContent ?? ""
      ),
      headings: all("h1,h2,h3,h4,h5,h6").map((h) => ({
        level: Number(h.tagName[1]),
        text: (h.textContent ?? "").trim()
      })),
      imgs: all<HTMLImageElement>("img").map((i) => ({
        src: i.getAttribute("src") ?? "",
        alt: i.getAttribute("alt"),
        w: i.getAttribute("width"),
        h: i.getAttribute("height")
      })),
      hrefs: all("a[href]").map((a) => ({
        href: a.getAttribute("href") ?? "",
        rel: a.getAttribute("rel") ?? ""
      })),
      insecure: all("link[href],script[src],img[src],source[src],iframe[src]")
        .map((e) => e.getAttribute("href") ?? e.getAttribute("src") ?? "")
        .filter((u) => u.startsWith("http://")),
      hreflangs: all("link[hreflang]").length,
      text: document.body.innerText
    }
  })

export const meta = (s: SeoSnapshot, key: string) =>
  s.metas.find(([k]) => k === key)?.[1]

export const canonicalFor = (p: string) => (p === "/" ? SITE : `${SITE}${p}`)

const BAD_STRING = /^(|undefined|null|NaN|\[object Object\])$/
const PLACEHOLDER = /\bundefined\b|\bNaN\b|\[object Object\]|\{\{|TODO/

/** Meta tag problems for an indexable page ("" list = healthy). */
export function metaProblems(s: SeoSnapshot, ref: PageRef): string[] {
  const out: string[] = []
  const want = canonicalFor(ref.path)
  const need = (key: string) => {
    const v = meta(s, key)
    if (!v) out.push(`missing <meta ${key}>`)
    else if (PLACEHOLDER.test(v)) out.push(`${key} has placeholder text: ${v}`)
    return v
  }

  if (!s.title.trim()) out.push("empty <title>")
  if (PLACEHOLDER.test(s.title)) out.push(`title placeholder: ${s.title}`)
  if (/NTUMods.*NTUMods.*NTUMods|NTUMods - NTUMods/.test(s.title)) {
    out.push(`site name repeated in title: ${s.title}`)
  }
  if (s.lang !== "en") out.push(`html lang=${s.lang}`)
  if (!meta(s, "viewport")) out.push("missing viewport")
  if (s.hreflangs) out.push("unexpected hreflang links")

  const desc = need("description")
  if (desc && desc.length < 50)
    out.push(`description ${desc.length} chars (<50)`)
  if (s.canonicals.length !== 1) {
    out.push(`${s.canonicals.length} canonical links`)
  } else if (s.canonicals[0] !== want) {
    out.push(`canonical ${s.canonicals[0]} != ${want}`)
  }
  if (/noindex/i.test(meta(s, "robots") ?? "")) out.push("page is noindex")

  need("og:title")
  need("og:description")
  need("og:site_name")
  need("og:type")
  const ogUrl = need("og:url")
  if (ogUrl && ogUrl !== want) out.push(`og:url ${ogUrl} != ${want}`)
  const ogImage = need("og:image")
  if (ogImage && !/^https:\/\//.test(ogImage)) {
    out.push(`og:image not absolute https: ${ogImage}`)
  }
  need("twitter:card")
  need("twitter:title")
  need("twitter:description")
  need("twitter:image")

  if (s.jsonld.some((j) => /"@type":"Article"/.test(j))) {
    if (meta(s, "og:type") !== "article") out.push("og:type should be article")
    if (!meta(s, "article:published_time")) {
      out.push("missing article:published_time")
    }
  }
  return out
}

/** Heading outline: one h1, no skipped levels. */
export function headingProblems(s: SeoSnapshot): string[] {
  const out: string[] = []
  const h1s = s.headings.filter((h) => h.level === 1)
  if (h1s.length !== 1) out.push(`${h1s.length} h1 elements`)
  if (h1s[0] && !h1s[0].text) out.push("empty h1")
  let prev = 0
  for (const h of s.headings) {
    if (prev && h.level > prev + 1) {
      out.push(`h${prev} -> h${h.level} skips a level ("${h.text}")`)
    }
    prev = h.level
  }
  return out
}

export function imageProblems(s: SeoSnapshot): string[] {
  const out: string[] = []
  for (const i of s.imgs) {
    if (i.alt === null) out.push(`img without alt: ${i.src}`)
  }
  for (const u of s.insecure) out.push(`mixed content: ${u}`)
  return out
}

const walk = (v: unknown, at: string, out: string[]) => {
  if (v === null || v === undefined) out.push(`${at} is ${v}`)
  else if (typeof v === "string") {
    if (BAD_STRING.test(v.trim())) out.push(`${at} is "${v}"`)
    const key = at.split(".").pop() ?? ""
    if (/^(url|item|logo|image|@id)$/.test(key) && !/^https?:\/\//.test(v)) {
      out.push(`${at} not absolute: ${v}`)
    }
    if (/^date/.test(key) && !/^\d{4}-\d{2}-\d{2}/.test(v)) {
      out.push(`${at} not ISO date: ${v}`)
    }
  } else if (typeof v === "number") {
    if (!Number.isFinite(v)) out.push(`${at} is ${v}`)
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, `${at}[${i}]`, out))
  } else if (typeof v === "object") {
    for (const [k, x] of Object.entries(v)) walk(x, `${at}.${k}`, out)
  }
}

type Json = Record<string, unknown>
const typesOf = (o: Json) => [o["@type"]].flat().map(String)

/** Parses every JSON-LD block, validates shape and cross-checks the page. */
export function jsonLdProblems(s: SeoSnapshot, ref: PageRef): string[] {
  const out: string[] = []
  const items: Json[] = []
  s.jsonld.forEach((raw, i) => {
    try {
      items.push(JSON.parse(raw))
    } catch (e) {
      out.push(`block ${i} is not valid JSON: ${(e as Error).message}`)
    }
  })
  const want = canonicalFor(ref.path)

  for (const o of items) {
    const t = typesOf(o).join(",")
    if (o["@context"] !== "https://schema.org") out.push(`${t}: bad @context`)
    if (!o["@type"]) out.push("block missing @type")
    walk(o, t, out)

    if (t === "Article") {
      for (const k of ["headline", "description", "datePublished"]) {
        if (!o[k]) out.push(`Article missing ${k}`)
      }
      if (!(o.author as Json | undefined)?.name) out.push("Article no author")
    }
    if (t === "Course") {
      for (const k of ["name", "courseCode", "description"]) {
        if (!o[k]) out.push(`Course missing ${k}`)
      }
      if (o.courseCode && !s.title.includes(String(o.courseCode))) {
        out.push(`Course ${o.courseCode} not in title "${s.title}"`)
      }
    }
    if (t === "BreadcrumbList") {
      const els = (o.itemListElement as Json[] | undefined) ?? []
      if (!els.length) out.push("BreadcrumbList empty")
      els.forEach((el, i) => {
        if (el.position !== i + 1) out.push(`breadcrumb ${i} position`)
        if (!el.name) out.push(`breadcrumb ${i} no name`)
        if (!el.item) out.push(`breadcrumb ${i} no item`)
      })
      const last = els.at(-1)
      if (last?.item && last.item !== want) {
        out.push(`breadcrumb last ${last.item} != canonical ${want}`)
      }
    }
    if (t === "FAQPage") {
      const qs = (o.mainEntity as Json[] | undefined) ?? []
      if (!qs.length) out.push("FAQPage has no questions")
      for (const q of qs) {
        if (!q.name || !(q.acceptedAnswer as Json)?.text) {
          out.push(`FAQ question incomplete: ${q.name}`)
        }
      }
    }
    if (/^(WebApplication|CollectionPage|Dataset)$/.test(t) && o.url !== want) {
      out.push(`${t} url ${o.url} != ${want}`)
    }
  }

  const types = items.flatMap(typesOf)
  const expect: Record<string, string[]> = {
    module: ["Course", "BreadcrumbList"],
    semester: ["BreadcrumbList"]
  }
  for (const t of expect[ref.kind] ?? []) {
    if (!types.includes(t)) out.push(`missing JSON-LD ${t}`)
  }
  // /articles/[slug] also serves category listings, which are CollectionPages.
  if (ref.kind === "article") {
    if (!types.includes("BreadcrumbList"))
      out.push("missing JSON-LD BreadcrumbList")
    if (!types.includes("Article") && !types.includes("CollectionPage")) {
      out.push("missing JSON-LD Article or CollectionPage")
    }
  }
  if (ref.path === "/") {
    for (const t of ["WebSite", "Organization"]) {
      if (!types.includes(t)) out.push(`home missing JSON-LD ${t}`)
    }
  }
  return out
}

/** Soft-404s and leaked markdown/template syntax in rendered body text. */
export function contentProblems(s: SeoSnapshot, ref: PageRef): string[] {
  const out: string[] = []
  const h1 = s.headings.find((h) => h.level === 1)?.text ?? ""
  if (/not found|404/i.test(h1)) out.push(`soft 404, h1 "${h1}"`)
  if (!s.text.trim()) out.push("empty body text")
  const leak = s.text.match(PLACEHOLDER)
  if (leak) out.push(`placeholder in body: ${leak[0]}`)
  if (ref.kind === "article") {
    if (/\]\(\S+\)/.test(s.text)) out.push("raw markdown link in article")
    if (/\*\*\S/.test(s.text)) out.push("raw markdown bold in article")
    if (/^#{1,6}\s/m.test(s.text)) out.push("raw markdown heading in article")
  }
  return out
}

/** Worth fixing but not worth failing CI over; surfaced as annotations. */
export function warnings(s: SeoSnapshot): string[] {
  const out: string[] = []
  if (s.title.length > 70) out.push(`title ${s.title.length} chars (>70)`)
  const desc = meta(s, "description")
  if (desc && desc.length > 170)
    out.push(`description ${desc.length} chars (>170)`)
  for (const i of s.imgs) {
    if (!i.w || !i.h) out.push(`img without width/height: ${i.src}`)
  }
  return out
}
