// Requests every sitemap URL so the Cloudflare edge holds a rendered copy
// before a crawler or student hits it cold. Run after a deploy or data refresh:
//   node scripts/warm-cache.mjs [--base https://ntumods.com] [--concurrency 5]
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : fallback
}
const rawBase = arg("base", "https://ntumods.com").replace(/\/$/, "")
const baseUrl = new URL(rawBase)
if (baseUrl.protocol !== "https:" && baseUrl.protocol !== "http:") {
  throw new Error(`Unsupported --base protocol: ${baseUrl.protocol}`)
}
const base = baseUrl.origin + baseUrl.pathname.replace(/\/$/, "")
const concurrency = Number(arg("concurrency", 5))

const sitemap = await (await fetch(`${base}/sitemap-0.xml`)).text()
// Only same-origin URLs: a sitemap must not point the warmer at other hosts.
const urls = [...sitemap.matchAll(/<loc>([^<]+)</g)]
  .map((m) => m[1].replace("https://ntumods.com", base))
  .flatMap((u) => {
    try {
      const parsed = new URL(u)
      if (parsed.origin !== baseUrl.origin) return []
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return []
      return [parsed.href]
    } catch {
      return []
    }
  })
console.log(`Warming ${urls.length} URLs on ${base}`)

let done = 0
const failed = []
const queue = [...urls]
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      try {
        const res = await fetch(url)
        await res.arrayBuffer()
        if (res.status !== 200) failed.push(`${res.status} ${url}`)
      } catch (e) {
        failed.push(`ERR ${url} ${e.message}`)
      }
      if (++done % 200 === 0) console.log(`${done}/${urls.length}`)
    }
  })
)
console.log(`Done. ${failed.length} non-200`)
failed.forEach((f) => console.log(f))
process.exitCode = failed.length ? 1 : 0
