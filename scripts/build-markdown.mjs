import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import { join, relative } from "node:path"
import { createDocument } from "@mixmark-io/domino"

import { NAV_MENUS } from "../src/components/nav/menus.ts"
import { siteConfig } from "../src/config/site.ts"
import { MCP_CLIENTS } from "../src/lib/developers/mcp-clients.ts"
import { DEV_LINKS } from "../src/lib/developers/pages.ts"
import {
  AGENT_SEARCH_INDEX,
  SEARCH_SHARDS,
  searchShard,
  searchTerms
} from "../src/lib/agent-search.ts"
import { MARKDOWN_FOOTER } from "../src/lib/markdown-footer.ts"
import {
  markdownFrontmatter,
  markdownPath
} from "../src/lib/markdown/metadata.ts"
import {
  getModuleMetadata,
  latestOfferings
} from "../src/lib/server/db/json-source.ts"

import { prepareDocument, renderDocument } from "./markdown/document.mjs"
import { renderPage } from "./markdown/pages.mjs"
import { normaliseMarkdown } from "./markdown/normalise.mjs"

const assets = "dist/client"
const site = new URL(process.env.SITE_URL || siteConfig.url)
const pageSources = new Map()
for (const file of await readdir(assets, {
  recursive: true,
  withFileTypes: true
})) {
  if (!file.isFile() || !file.name.endsWith(".html")) continue
  const source = join(file.parentPath, file.name)
  const page = `/${relative(assets, source)}`.replace(/(?:\/index)?\.html$/, "")
  pageSources.set(page || "/", source)
}

// The sitemap only includes source-backed dates. An export is not a content update.
const lastUpdated = new Map()
const sitemapUrls = new Set()
for (const name of (await readdir(assets)).filter((file) =>
  /^sitemap-\d+\.xml$/.test(file)
)) {
  const xml = await readFile(join(assets, name), "utf8")
  for (const [, url] of xml.matchAll(/<loc>([^<]+)<\/loc>/g))
    sitemapUrls.add(new URL(url).href)
  for (const [, url, date] of xml.matchAll(
    /<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g
  )) {
    lastUpdated.set(new URL(url).pathname, date)
  }
}

// Include links in collapsed site menus and the developer sidebar. The
// prerendered homepage also includes footer links and the home link.
const homepage = createDocument(await readFile(pageSources.get("/"), "utf8"))
const navigation = new Set(
  [
    ...Array.from(
      homepage.querySelectorAll("header a[href], footer a[href]"),
      (link) => link.getAttribute("href")
    ),
    ...siteConfig.navLinks.map((link) => link.route),
    ...Object.values(NAV_MENUS).flatMap((menu) => [
      menu.footer?.href,
      ...[...menu.items, ...(menu.aside?.items ?? [])].flatMap((item) => [
        item.href,
        item.guide?.href
      ])
    ]),
    ...DEV_LINKS.map((link) => link.href),
    ...MCP_CLIENTS.map((client) => `/developers/mcp/${client.id}`)
  ]
    .filter(Boolean)
    .map((href) => new URL(href, site))
    .filter((url) => url.origin === site.origin)
    .map((url) => url.pathname.replace(/\/$/, "") || "/")
)

let pages = 0
const searchPages = []
const searchPostings = new Map()
function indexPage({ url, title, description, text }) {
  const pageIndex = searchPages.length
  searchPages.push({
    url,
    title,
    description: (description || text).slice(0, 320)
  })
  const weights = new Map(searchTerms(text).map((term) => [term, 1]))
  for (const term of searchTerms(description)) weights.set(term, 4)
  for (const term of searchTerms(title)) weights.set(term, 8)
  for (const [term, weight] of weights) {
    if (!searchPostings.has(term)) searchPostings.set(term, [])
    searchPostings.get(term).push([pageIndex, weight])
  }
}

for (const [page, source] of pageSources) {
  const url = new URL(page, site)
  const document = createDocument(await readFile(source, "utf8"))
  // Astro emits HTML stubs for redirects. Preserve the ordinary redirect path.
  if (document.querySelector('meta[http-equiv="refresh"]')) continue

  const content = document.querySelector("main") ?? document.body
  const canonical =
    document
      .querySelector('head link[rel="canonical"]')
      ?.getAttribute("href") ?? url.href
  const title =
    content.querySelector("h1")?.textContent.trim() || document.title.trim()
  const description =
    document
      .querySelector('head meta[name="description"]')
      ?.getAttribute("content") ?? ""
  const alternate = document
    .querySelector('head link[rel="alternate"][type="text/markdown"]')
    ?.getAttribute("href")
  if (alternate !== markdownPath(page))
    throw new Error("Missing Markdown alternate for " + page)
  const metadata = markdownFrontmatter({
    title,
    description,
    url: canonical,
    lastUpdated:
      document
        .querySelector('head meta[property="article:modified_time"]')
        ?.getAttribute("content") ?? lastUpdated.get(page)
  })
  const structuredData = Array.from(
    document.querySelectorAll('script[type="application/ld+json"]'),
    (script) => JSON.parse(script.textContent)
  )
  prepareDocument(content)
  if (
    new URL(canonical, site).href === url.href &&
    !document.querySelector('head meta[name="robots"][content*="noindex"]')
  ) {
    indexPage({
      url: canonical,
      title,
      description,
      text: content.textContent.replace(/\s+/g, " ").trim()
    })
  }
  const append = []
  const rendered = await renderPage({ page, document, content, url, append })
  const sections =
    rendered === undefined
      ? renderDocument({ document, content, url, navigation, pageSources })
      : [rendered]
  const body = normaliseMarkdown(
    [...sections, ...append].filter(Boolean).join("\n\n")
  )
  const jsonLd = structuredData.length
    ? "```json\n" +
      JSON.stringify(
        structuredData.length === 1 ? structuredData[0] : structuredData,
        null,
        2
      ) +
      "\n```"
    : ""
  const markdown = [metadata, body, jsonLd, "---\n\n" + MARKDOWN_FOOTER]
    .filter(Boolean)
    .join("\n\n")
  const target = join(assets, markdownPath(page).slice(1))
  await writeFile(target, `${markdown}\n`, { flag: "wx" })
  pages++
}

if (!pages)
  throw new Error("No prerendered pages found for Markdown generation")

const latestModules = new Map(
  latestOfferings().map((entry) => [entry.code, entry])
)
for (const url of sitemapUrls) {
  const { pathname } = new URL(url)
  if (pageSources.has(pathname)) continue
  const module = /^\/mods\/([A-Z0-9]+)(?:\/(\d{4})\/(\d+))?$/.exec(pathname)
  if (!module) continue
  const [, code, year, semester] = module
  const offering = year ? { year, semester } : latestModules.get(code)
  if (!offering) continue
  const metadata = getModuleMetadata(code, offering.year, offering.semester)
  if (!metadata?.title) continue
  const term = year ? ` (AY${year}, Semester ${semester})` : ""
  indexPage({
    url,
    title: `${code} ${metadata.title}${term}`,
    description: metadata.description ?? "",
    text: ""
  })
}

const searchDir = join(assets, AGENT_SEARCH_INDEX.slice(1))
const shards = Array.from({ length: SEARCH_SHARDS }, () => Object.create(null))
for (const [term, postings] of searchPostings)
  shards[searchShard(term)][term] = postings

await mkdir(searchDir, { recursive: true })
await Promise.all([
  writeFile(join(searchDir, "pages.json"), JSON.stringify(searchPages)),
  ...shards.map((shard, id) =>
    writeFile(join(searchDir, `${id}.json`), JSON.stringify(shard))
  )
])
console.log(`[Markdown] Generated ${pages} static pages`)
