// Astro has no equivalent of next-sitemap's auto-discovery of static pages
// from the build output, so every route is enumerated explicitly here. The
// logic (module-map + metadata directory walk, year cutoff, current-semester
// skip) is ported from the old next-sitemap.config.js to keep the same SEO
// signal — thin/old versioned module pages stay out of the sitemap even though
// the routes still resolve (a crawl-budget decision, not a routing one).
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
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

async function getModuleRoutes() {
  const moduleMap = JSON.parse(
    await fs.readFile(path.join(ROOT, "src/data/api/module-map.json"), "utf-8")
  )

  const modulePaths = Object.keys(moduleMap).map((key) => `/mods/${key}`)

  const metadataDir = path.join(ROOT, "src/data/api/metadata")
  const versionedPaths = []
  for (const file of (await fs.readdir(metadataDir)).filter((f) =>
    f.endsWith(".json")
  )) {
    const stem = file.replace(".json", "")
    const sep = stem.indexOf("_")
    const year = stem.slice(0, sep)
    const semester = stem.slice(sep + 1)
    // Skip years older than cutoff — those pages are thin (no index data) and cause soft 404s
    if (parseInt(year) < SITEMAP_YEAR_CUTOFF) continue
    const data = JSON.parse(
      await fs.readFile(path.join(metadataDir, file), "utf-8")
    )
    for (const moduleCode of Object.keys(data)) {
      const entry = moduleMap[moduleCode]
      // Skip current semester — /mods/:code/:year/:semester redirects these to /mods/:code
      if (
        entry &&
        entry.currentYear === year &&
        entry.currentSemester === semester
      )
        continue
      versionedPaths.push(`/mods/${moduleCode}/${year}/${semester}`)
    }
  }

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
