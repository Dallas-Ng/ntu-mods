import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KEY = "59b2d3cb6fb844b8b9d417ea7c92c380"
const HOST = "ntumods.com"
const ENDPOINT = "https://api.indexnow.org/IndexNow"
const BATCH_SIZE = 10_000

// Only ping IndexNow from a real production deploy, never from a local build.
// Cloudflare Workers Builds sets WORKERS_CI=1 (and Pages sets CF_PAGES=1);
// INDEXNOW=1 forces it on for a manual deploy from a workstation.
const isProductionBuild =
  process.env.INDEXNOW === "1" ||
  process.env.WORKERS_CI === "1" ||
  process.env.CF_PAGES === "1"

// Workers Builds also runs this for every non-production branch (PR preview
// builds), where WORKERS_CI_BRANCH is that branch's name. Don't submit the
// production sitemap on behalf of a preview.
const PRODUCTION_BRANCH = "main"
const isPreviewBranch =
  process.env.INDEXNOW !== "1" &&
  !!process.env.WORKERS_CI_BRANCH &&
  process.env.WORKERS_CI_BRANCH !== PRODUCTION_BRANCH

if (!isProductionBuild || isPreviewBranch) {
  console.log(
    "[IndexNow] Skipping — not a production build (set INDEXNOW=1 to force)"
  )
  process.exit(0)
}

// The build writes sitemap-*.xml to dist/client/ (see scripts/build-sitemap.mjs).
const publicDir = path.join(__dirname, process.argv[2] || "../dist/client")
const files = (await fs.readdir(publicDir))
  .filter((f) => /^sitemap-\d+\.xml$/.test(f))
  .sort()

const allUrls = []
for (const f of files) {
  const xml = await fs.readFile(path.join(publicDir, f), "utf8")
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])
  allUrls.push(...matches)
}
console.log(`[IndexNow] ${allUrls.length} URLs across ${files.length} sitemaps`)

const totalBatches = Math.ceil(allUrls.length / BATCH_SIZE)
for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
  const batch = allUrls.slice(i, i + BATCH_SIZE)
  const n = Math.floor(i / BATCH_SIZE) + 1
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: `https://${HOST}/${KEY}.txt`,
        urlList: batch,
      }),
    })
    if (!res.ok) {
      console.warn(`[IndexNow] Batch ${n}/${totalBatches} HTTP ${res.status}`)
    } else {
      console.log(`[IndexNow] Batch ${n}/${totalBatches} accepted (${res.status})`)
    }
  } catch (err) {
    console.warn(`[IndexNow] Batch ${n}/${totalBatches} error:`, err.message)
  }
}
