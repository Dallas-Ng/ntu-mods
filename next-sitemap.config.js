/** @type {import('next-sitemap').IConfig} */
const MODULE_MAP = require("./src/data/api/module-map.json")

module.exports = {
  siteUrl: process.env.SITE_URL || "https://ntumods.com",
  generateRobotsTxt: true, // (optional)
  exclude: ["/debug", "/settings"],
  additionalPaths: async (config) => {
    return Object.keys(MODULE_MAP).map((key) => ({
      loc: `/mods/${key}`,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? []
    }))
  }
}
