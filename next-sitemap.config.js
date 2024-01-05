/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://dabao.dallasng.me",
  generateRobotsTxt: true, // (optional)
  exclude: ["/debug"]
}
