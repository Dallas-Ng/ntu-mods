// Astro has no equivalent of next-sitemap's auto-discovery of static pages
// from the build output, so every route is enumerated explicitly here. The
// logic (year cutoff, current-semester skip) is ported from the old
// next-sitemap.config.js to keep the same SEO signal — thin/old versioned
// module pages stay out of the sitemap even though the routes still resolve (a
// crawl-budget decision, not a routing one).
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { DatabaseSync } from "node:sqlite"

import {
  ALL_MODULE_CODES_SQL,
  SITEMAP_VERSIONED_OFFERINGS_SQL,
} from "../src/lib/server/db/queries.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const DB_PATH = process.env.NTU_MODS_DB
  ? path.resolve(process.env.NTU_MODS_DB)
  : path.join(ROOT, "db/ntu-mods.sqlite")
const SITE_URL = process.env.SITE_URL || "https://ntumods.com"
const SITEMAP_SIZE = 5000
const OUT_DIR = path.join(ROOT, "dist", "client")

const CHANGEFREQ = "daily"
const PRIORITY = "0.7"

const now = new Date()
const currentAYStart =
  now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
const SITEMAP_YEAR_CUTOFF = currentAYStart - 1

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
  const categories = new Set()

  for (const file of files) {
    const slug = file.replace(/\.md$/, "")
    slugs.push(slug)
    const raw = await fs.readFile(path.join(articlesDir, file), "utf-8")
    const match = /^category:\s*(.+)$/m.exec(raw)
    const category = match ? match[1].trim().replace(/^["']|["']$/g, "") : "General"
    categories.add(category)
  }

  const categorySlugs = Array.from(categories).map(slugifyCategory)
  return [
    ...slugs.map((slug) => `/articles/${slug}`),
    ...categorySlugs.map((slug) => `/articles/${slug}`)
  ]
}

// Was a merge of module-map.json with a walk of all 45 metadata files. The two
// exclusions it applied are now the query's WHERE clause: rn > 1 drops each
// module's current offering (those URLs redirect to /mods/:code), and the year
// cutoff drops old thin pages that read as soft 404s.
function getModuleRoutes() {
  const db = new DatabaseSync(DB_PATH, { readOnly: true })
  try {
    const modulePaths = db
      .prepare(ALL_MODULE_CODES_SQL)
      .all()
      .map((r) => `/mods/${r.code}`)

    const versionedPaths = db
      .prepare(SITEMAP_VERSIONED_OFFERINGS_SQL)
      .all(SITEMAP_YEAR_CUTOFF)
      .map((r) => `/mods/${r.code}/${r.year}/${r.semester}`)

    return [...modulePaths, ...versionedPaths]
  } finally {
    db.close()
  }
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
  "/timetable"
]

function buildUrlEntry(loc, lastmod) {
  const url = loc === "/" ? SITE_URL : `${SITE_URL}${loc}`
  return `<url><loc>${url}</loc><lastmod>${lastmod}</lastmod><changefreq>${CHANGEFREQ}</changefreq><priority>${PRIORITY}</priority></url>`
}

function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

async function main() {
  const lastmod = new Date().toISOString()
  const [articleRoutes, moduleRoutes] = await Promise.all([
    getArticleRoutes(),
    getModuleRoutes()
  ])

  const allRoutes = [...CORE_ROUTES, ...articleRoutes, ...moduleRoutes]
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
      const body = routes.map((loc) => buildUrlEntry(loc, lastmod)).join("\n")
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
