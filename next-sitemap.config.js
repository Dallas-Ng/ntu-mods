/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://ntumods.com",
  generateRobotsTxt: true, // (optional)
  exclude: ["/debug", "/settings"]
}
