/** @type {import('next-sitemap').IConfig} */
const MODULE_MAP = require("./src/data/api/module-map.json")

module.exports = {
  siteUrl: process.env.SITE_URL || "https://ntumods.com",
  generateRobotsTxt: true,
  exclude: ["/debug", "/settings", "/screenshot", "/share", "/sitemap"],
  additionalPaths: async (config) => {
    const staticPages = ["/mods", "/timetable"].map((loc) => ({
      loc,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? []
    }))

    const modulePaths = Object.keys(MODULE_MAP).map((key) => ({
      loc: `/mods/${key}`,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? []
    }))

    return [...staticPages, ...modulePaths]
  }
}
