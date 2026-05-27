/** @type {import('next-sitemap').IConfig} */
const fs = require("fs")
const path = require("path")
const MODULE_MAP = require("./src/data/api/module-map.json")

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
      const data = JSON.parse(fs.readFileSync(path.join(metadataDir, file), "utf-8"))
      for (const moduleCode of Object.keys(data)) {
        versionedPaths.push({ loc: `/mods/${moduleCode}/${year}/${semester}`, ...defaults })
      }
    }

    return [...staticPages, ...modulePaths, ...versionedPaths]
  }
}
