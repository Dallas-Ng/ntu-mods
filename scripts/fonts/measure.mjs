// Which font files does each built page really download? Run after `pnpm build`:
//
//   node scripts/fonts/measure.mjs [dist/client] [--delay-core 1500] [--sample 200] [--concurrency 3]
//
// Serves the build, opens every page in Chromium with a cold cache and lists the
// font requests. This is the check the extended files depend on: text scans
// cannot see characters the browser draws itself (the `…` of text-overflow, the
// `•` of a list marker). --delay-core holds the core file back, like a slow
// connection: the fallback font is wider, more text truncates, and the
// extended file gets requested. Keep --concurrency low: a busy CPU does the same.
import { createHash } from "node:crypto"
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { chromium } from "@playwright/test"

const args = process.argv.slice(2)
const flag = (name, dflt) => {
  const i = args.indexOf(name)
  return i < 0 ? dflt : args.splice(i, 2)[1]
}
const delayCore = +flag("--delay-core", 0)
const sample = +flag("--sample", 0)
const concurrency = +flag("--concurrency", 3)
const dist = path.resolve(args[0] ?? "dist/client")
const manifest = JSON.parse(
  fs.readFileSync("src/assets/fonts/manifest.json", "utf8")
)

// Name each built font file by the manifest entry with the same hash.
const roles = {}
for (const f of fs.readdirSync(path.join(dist, "_astro/fonts"))) {
  const sha = createHash("sha256")
    .update(fs.readFileSync(path.join(dist, "_astro/fonts", f)))
    .digest("hex")
  for (const [slug, fam] of Object.entries(manifest.families))
    for (const [kind, file] of Object.entries(fam.files))
      if (file.sha256 === sha) roles[`/_astro/fonts/${f}`] = `${slug}-${kind}`
}

const walk = (d, out = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) {
      if (e.name !== "_astro" && e.name !== "data") walk(p, out)
    } else if (p.endsWith(".html")) out.push(p)
  }
  return out
}
let pages = walk(dist)
  .map(
    (f) =>
      "/" +
      path
        .relative(dist, f)
        .replace(/\.html$/, "")
        .replace(/(^|\/)index$/, "$1")
  )
  .sort()
if (sample && sample < pages.length)
  pages = pages.filter((_, i) => i % Math.ceil(pages.length / sample) === 0)

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname)
  for (const c of [p, `${p}.html`, path.join(p, "index.html")]) {
    const f = path.join(dist, c)
    if (f.startsWith(dist) && fs.existsSync(f) && fs.statSync(f).isFile()) {
      const type = f.endsWith(".html")
        ? "text/html; charset=utf-8"
        : f.endsWith(".woff2")
          ? "font/woff2"
          : "application/octet-stream"
      const body = fs.readFileSync(f)
      res.writeHead(200, {
        "content-type": type,
        "content-length": body.length,
        "cache-control": p.startsWith("/_astro/")
          ? "public, max-age=31536000, immutable"
          : "no-cache"
      })
      return res.end(body)
    }
  }
  res.writeHead(404).end()
})
await new Promise((r) => server.listen(0, r))
const base = `http://localhost:${server.address().port}`

// CHROMIUM_PATH: use a browser other than the one Playwright installed (CI images, sandboxes).
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH
})
const results = {}
let next = 0
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (next < pages.length) {
      const p = pages[next++]
      const ctx = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        serviceWorkers: "block"
      })
      const page = await ctx.newPage()
      await page.route(
        (u) => !u.href.startsWith(base),
        (r) => r.abort()
      )
      if (delayCore)
        for (const [url, role] of Object.entries(roles))
          if (role.endsWith("-core"))
            await page.route(`**${url}`, async (r) => {
              await new Promise((res) => setTimeout(res, delayCore))
              r.continue()
            })
      const fonts = []
      page.on("requestfinished", async (r) => {
        if (r.resourceType() === "font")
          fonts.push({
            role: roles[new URL(r.url()).pathname] ?? r.url(),
            bytes: (await r.sizes()).responseBodySize
          })
      })
      await page.goto(base + p, { waitUntil: "networkidle", timeout: 45000 })
      await page.waitForTimeout(300)
      const preloads = await page.$$eval("link[rel=preload][as=font]", (ls) =>
        ls.map((l) => new URL(l.href).pathname)
      )
      results[p] = { fonts, preloads: preloads.map((u) => roles[u] ?? u) }
      await ctx.close()
    }
  })
)
await browser.close()
server.close()

const group = (p) =>
  p.startsWith("/mods/")
    ? "module pages"
    : p.startsWith("/articles/")
      ? "articles"
      : p.startsWith("/developers")
        ? "developer docs"
        : "everything else"
const rows = {}
for (const [p, r] of Object.entries(results)) {
  const g = (rows[group(p)] ??= { n: 0, bytes: 0, ext: [], pre: new Set() })
  g.n++
  g.bytes += r.fonts.reduce((s, f) => s + f.bytes, 0)
  if (r.fonts.some((f) => f.role.endsWith("-ext"))) g.ext.push(p)
  g.pre.add(r.preloads.sort().join(" + "))
}
console.log(
  `${pages.length} pages${delayCore ? `, core delayed ${delayCore} ms` : ""}, cold cache\n`
)
let total = 0
for (const [name, g] of Object.entries(rows)) {
  total += g.bytes
  console.log(
    `${name.padEnd(16)} ${String(g.n).padStart(5)} pages  ${Math.round(
      g.bytes / g.n
    )
      .toString()
      .padStart(
        6
      )} B/page  extended file on ${String(g.ext.length).padStart(4)}  preloads: ${[...g.pre].join(" | ")}`
  )
}
console.log(
  `${"all".padEnd(16)} ${String(pages.length).padStart(5)} pages  ${Math.round(
    total / pages.length
  )
    .toString()
    .padStart(6)} B/page`
)
const ext = Object.entries(results)
  .filter(([, r]) => r.fonts.some((f) => f.role.endsWith("-ext")))
  .map(([p]) => p)
if (ext.length)
  console.log(
    `\nPages that downloaded an extended file:\n  ${ext.slice(0, 40).join("\n  ")}${ext.length > 40 ? `\n  ... ${ext.length - 40} more` : ""}`
  )
