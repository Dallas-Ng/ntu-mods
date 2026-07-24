import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KEY = "59b2d3cb6fb844b8b9d417ea7c92c380"
const HOST = "ntumods.com"
const ENDPOINT = "https://api.indexnow.org/IndexNow"
const BATCH_SIZE = 10_000

if (process.env.VERCEL_ENV !== "production") {
  console.log(`[IndexNow] Skipping — VERCEL_ENV="${process.env.VERCEL_ENV ?? "unset"}"`)
  process.exit(0)
}

// Next writes sitemap-*.xml to public/; the Astro build writes them to
// dist/client/ instead — pass that dir explicitly when running under Astro.
const publicDir = path.join(__dirname, process.argv[2] || "../public")
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
