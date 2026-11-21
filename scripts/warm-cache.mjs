// Requests every sitemap URL so the Cloudflare edge holds a rendered copy
// before a crawler or student hits it cold. Run after a deploy or data refresh:
//   node scripts/warm-cache.mjs [--base https://ntumods.com] [--concurrency 5]
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback
}
const baseUrl = new URL(arg("base", "https://ntumods.com"))
if (baseUrl.protocol !== "https:" && baseUrl.protocol !== "http:") {
  throw new Error(`Unsupported --base protocol: ${baseUrl.protocol}`)
}
const basePath = baseUrl.pathname.replace(/\/+$/, "")
const base = `${baseUrl.origin}${basePath}`
const concurrency = Number(arg("concurrency", 5))

const sitemap = await (await fetch(`${base}/sitemap-0.xml`)).text()
// Only same-origin URLs: a sitemap must not point the warmer at other hosts.
const urls = [...sitemap.matchAll(/<loc>([^<]+)</g)].flatMap((m) => {
  try {
    const loc = new URL(m[1])
    const target =
      loc.origin === "https://ntumods.com"
        ? new URL(`${base}${loc.pathname}${loc.search}${loc.hash}`)
        : loc
    if (target.origin !== baseUrl.origin) return []
    if (target.protocol !== "https:" && target.protocol !== "http:") return []
    if (
      basePath &&
      target.pathname !== basePath &&
      !target.pathname.startsWith(`${basePath}/`)
    ) {
      return []
    }
    return [target.href]
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
