/** @type {import('next-sitemap').IConfig} */
const fs = require("fs")
const path = require("path")
const MODULE_MAP = require("./src/data/api/module-map.json")

// Match the cutoff used in app/mods/[module]/[year]/[semester]/page.tsx
const now = new Date()
const currentAYStart = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
const SITEMAP_YEAR_CUTOFF = currentAYStart - 1

module.exports = {
  siteUrl: process.env.SITE_URL || "https://ntumods.com",
  generateRobotsTxt: true,
  exclude: ["/debug", "/settings", "/screenshot", "/share", "/sitemap"],
  additionalPaths: async (config) => {
    const defaults = {
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? []
    }

    const staticPages = ["/mods", "/timetable"].map((loc) => ({ loc, ...defaults }))

    const modulePaths = Object.keys(MODULE_MAP).map((key) => ({
      loc: `/mods/${key}`,
      ...defaults
    }))

    const metadataDir = path.join(process.cwd(), "src/data/api/metadata")
    const versionedPaths = []
    for (const file of fs.readdirSync(metadataDir).filter((f) => f.endsWith(".json"))) {
      const stem = file.replace(".json", "")
      const sep = stem.indexOf("_")
      const year = stem.slice(0, sep)
      const semester = stem.slice(sep + 1)
      // Skip years older than cutoff — those pages are thin (no index data) and cause soft 404s
      if (parseInt(year) < SITEMAP_YEAR_CUTOFF) continue
      const data = JSON.parse(fs.readFileSync(path.join(metadataDir, file), "utf-8"))
      for (const moduleCode of Object.keys(data)) {
        const entry = MODULE_MAP[moduleCode]
        // Skip current semester — page.tsx redirects versioned current-semester URLs to /mods/CODE
        if (entry && entry.currentYear === year && entry.currentSemester === semester) continue
        versionedPaths.push({ loc: `/mods/${moduleCode}/${year}/${semester}`, ...defaults })
      }
    }

    return [...staticPages, ...modulePaths, ...versionedPaths]
  }
}
