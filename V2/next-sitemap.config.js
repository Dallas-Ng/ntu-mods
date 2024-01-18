/** @type {import('next-sitemap').IConfig} */
const M_DATA_S1 = require("./src/data/2023/m-data-s1.json")
const M_DATA_S2 = require("./src/data/2023/m-data-s2.json")

const M_DATA = {
  ...M_DATA_S1,
  ...M_DATA_S2
}

module.exports = {
  siteUrl: process.env.SITE_URL || "https://ntumods.com",
  generateRobotsTxt: true, // (optional)
  exclude: ["/debug", "/settings"],
  additionalPaths: async (config) => {
    return Object.keys(M_DATA).map((key) => ({
      loc: `/mods/${key}`,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? []
    }))
  }
}
