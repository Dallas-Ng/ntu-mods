/** @type {import('next-sitemap').IConfig} */
const CONDLIDATED_COURSE_DATA_2023_1 = require("./data/consolidated-course-content-2023-1.json")
const CONDLIDATED_COURSE_DATA_2023_2 = require("./data/consolidated-course-content-2023-1.json")

const C_COURSE_DATA = {
  ...CONDLIDATED_COURSE_DATA_2023_1,
  ...CONDLIDATED_COURSE_DATA_2023_2
}

module.exports = {
  siteUrl: process.env.SITE_URL || "https://ntumods.com",
  generateRobotsTxt: true, // (optional)
  exclude: ["/debug", "/settings", "/screenshot"],
  additionalPaths: async (config) => {
    return Object.keys(C_COURSE_DATA).map((key) => ({
      loc: `/mods/${key}`,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? []
    }))
  }
}
