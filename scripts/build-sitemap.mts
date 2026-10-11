// Astro has no equivalent of next-sitemap's auto-discovery of static pages
// from the build output, so every route is enumerated explicitly here. The
// logic (year cutoff, current-semester skip) is ported from the old
// next-sitemap.config.js to keep the same SEO signal — thin/old versioned
// module pages stay out of the sitemap even though the routes still resolve (a
// crawl-budget decision, not a routing one).
import { execFileSync } from "child_process"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

import * as json from "../src/lib/server/db/json-source.ts"
import {
  moduleYearCutoff,
  versionedYearCutoff
} from "../src/lib/sitemap-policy.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const SITE_URL = process.env.SITE_URL || "https://ntumods.com"
const SITEMAP_SIZE = 5000
const OUT_DIR = path.join(ROOT, "dist", "client")

// changefreq and priority are ignored by Google, and a lastmod that is always
// "now" teaches it to ignore lastmod too. So lastmod is only written when a
// real date is known: an article's frontmatter, or the git history of the
// module data file. Everything else omits it.
// A shallow clone (CI default) stamps every file with the checkout commit, so
// git dates are skipped there rather than reported as fake.
const IS_SHALLOW =
  execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
    cwd: ROOT,
    encoding: "utf8"
  }).trim() !== "false"

const gitDates = new Map()
function gitDate(file) {
  if (IS_SHALLOW) return undefined
  if (!gitDates.has(file)) {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", file], {
      cwd: ROOT,
      encoding: "utf8"
    }).trim()
    gitDates.set(file, out || undefined)
  }
  return gitDates.get(file)
}
const semDate = (sem) => gitDate(`src/data/api/metadata/${sem}.json`)

const SITEMAP_YEAR_CUTOFF = versionedYearCutoff()
const MODULE_YEAR_CUTOFF = moduleYearCutoff()

const slugifyCategory = (category) =>
  category
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

async function getArticleRoutes() {
  const articlesDir = path.join(ROOT, "content/articles")
  const files = (await fs.readdir(articlesDir)).filter(
    (f) => f.endsWith(".md") && !f.startsWith("_")
  )

  const slugs = []
  const dates = new Map()
  const categories = new Set()

  for (const file of files) {
    const slug = file.replace(/\.md$/, "")
    slugs.push(slug)
    const raw = await fs.readFile(path.join(articlesDir, file), "utf-8")
    const field = (name) =>
      new RegExp(`^${name}:\\s*["']?([^"'\\n]+)`, "m").exec(raw)?.[1].trim()
    const modified = field("updated") || field("date")
    if (modified) dates.set(slug, new Date(modified).toISOString())
    const match = /^category:\s*(.+)$/m.exec(raw)
    const category = match
      ? match[1].trim().replace(/^["']|["']$/g, "")
      : "General"
    categories.add(category)
  }

  const categorySlugs = Array.from(categories).map(slugifyCategory)
  return [
    ...slugs.map((slug) => ({
      loc: `/articles/${slug}`,
      lastmod: dates.get(slug)
    })),
    ...categorySlugs.map((slug) => ({ loc: `/articles/${slug}` }))
  ]
}

// Was a merge of module-map.json with a walk of all 45 metadata files. The two
// exclusions it applied are now versionedOfferings' own filtering: excluding
// each module's current offering (those URLs redirect to /mods/:code) and the
// year cutoff, which drops old thin pages that read as soft 404s.
function getModuleRoutes() {
  const modulePaths = json
    .latestOfferings()
    .filter((o) => Number(o.year) >= MODULE_YEAR_CUTOFF)
    .map((o) => ({ loc: `/mods/${o.code}`, lastmod: semDate(o.sem) }))

  const versionedPaths = json
    .versionedOfferings(SITEMAP_YEAR_CUTOFF)
    .map((o) => ({
      loc: `/mods/${o.code}/${o.year}/${o.semester}`,
      lastmod: semDate(`${o.year}_${o.semester}`)
    }))

  return [...modulePaths, ...versionedPaths]
}

const CORE_ROUTES = [
  "/",
  "/ai-instructions",
  "/articles",
  "/changelog",
  "/exams",
  "/faq",
  "/feedback",
  "/links",
  "/llms.txt",
  "/llms.md",
  "/mods",
  "/privacy",
  "/timetable",
  "/tools",
  "/tools/cgpa-planner",
  "/tools/fgo-optimiser"
]

function buildUrlEntry({ loc, lastmod }) {
  const url = loc === "/" ? SITE_URL : `${SITE_URL}${loc}`
  const mod = lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
  return `<url><loc>${url}</loc>${mod}</url>`
}

function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

async function main() {
  const [articleRoutes, moduleRoutes] = await Promise.all([
    getArticleRoutes(),
    getModuleRoutes()
  ])

  const allRoutes = [
    ...CORE_ROUTES.map((loc) => ({ loc })),
    ...articleRoutes,
    ...moduleRoutes
  ]
  const chunks = chunk(allRoutes, SITEMAP_SIZE)

  await fs.mkdir(OUT_DIR, { recursive: true })

  // Astro copies public/ verbatim into dist/client, and an incremental build
  // can leave a previous run's sitemap-*.xml behind — a shrinking URL set would
  // otherwise keep serving orphaned chunks. Clear them before writing fresh.
  const existing = await fs.readdir(OUT_DIR)
  await Promise.all(
    existing
      .filter((f) => /^sitemap(-\d+)?\.xml$/.test(f))
      .map((f) => fs.rm(path.join(OUT_DIR, f)))
  )

  await Promise.all(
    chunks.map((routes, i) => {
      const body = routes.map(buildUrlEntry).join("\n")
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${body}\n</urlset>`
      return fs.writeFile(path.join(OUT_DIR, `sitemap-${i}.xml`), xml)
    })
  )

  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${chunks
    .map((_, i) => `<sitemap><loc>${SITE_URL}/sitemap-${i}.xml</loc></sitemap>`)
    .join("\n")}\n</sitemapindex>`
  await fs.writeFile(path.join(OUT_DIR, "sitemap.xml"), indexXml)

  const robotsTxt = `# *\nUser-agent: *\nAllow: /\n\n# Host\nHost: ${SITE_URL}\n\n# Sitemaps\nSitemap: ${SITE_URL}/sitemap.xml\n`
  await fs.writeFile(path.join(OUT_DIR, "robots.txt"), robotsTxt)

  console.log(
    `[build-sitemap] ${allRoutes.length} URLs across ${chunks.length} sitemap file(s)`
  )
}

main().catch((err) => {
  console.error("[build-sitemap] failed:", err)
  process.exit(1)
})
