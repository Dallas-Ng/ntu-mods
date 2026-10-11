import fs from "node:fs"
import path from "node:path"
import { expect, test } from "@playwright/test"

import { sample, SITE, sitemapPaths } from "./lib/urls"

const local = (u: string) => new URL(u, "http://x").pathname

test.describe("robots and sitemap", () => {
  test("robots.txt allows crawling and names the sitemap", async ({
    request
  }) => {
    const res = await request.get("/robots.txt")
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toMatch(/^User-agent: \*/m)
    expect(body).not.toMatch(/^Disallow:\s*\/\s*$/m)
    expect(body).not.toMatch(/^Disallow:.*(_astro|\.css|\.js)/m)
    expect(body).toContain(`Sitemap: ${SITE}/sitemap.xml`)
  })

  test("sitemap index and files are well formed", async ({ request }) => {
    const index = await (await request.get("/sitemap.xml")).text()
    const files = [...index.matchAll(/<loc>([^<]+)</g)].map((m) => m[1])
    expect(files.length).toBeGreaterThan(0)
    const urls: string[] = []
    for (const f of files) {
      const res = await request.get(local(f))
      expect(res.status(), f).toBe(200)
      const locs = [...(await res.text()).matchAll(/<loc>([^<]+)</g)].map(
        (m) => m[1]
      )
      expect(locs.length, f).toBeLessThanOrEqual(50_000)
      urls.push(...locs)
    }
    expect(urls.filter((u) => !u.startsWith(`${SITE}/`) && u !== SITE)).toEqual(
      []
    )
    expect(urls.length).toBe(new Set(urls).size)
  })

  test("sitemap lastmod is real: valid, never in the future, not a blanket stamp", async ({
    request
  }) => {
    const index = await (await request.get("/sitemap.xml")).text()
    const mods: string[] = []
    for (const f of [...index.matchAll(/<loc>([^<]+)</g)].map((m) => m[1])) {
      const body = await (await request.get(local(f))).text()
      expect(body).not.toMatch(/<changefreq>|<priority>/)
      mods.push(...[...body.matchAll(/<lastmod>([^<]+)</g)].map((m) => m[1]))
    }
    for (const m of mods) {
      expect(Number.isNaN(Date.parse(m)), m).toBe(false)
      expect(Date.parse(m), m).toBeLessThanOrEqual(Date.now())
    }
    // Articles carry their own dates, so a build-time stamp would show up as
    // one single value across the whole file.
    expect(new Set(mods).size).toBeGreaterThan(1)
  })

  test("random sitemap URLs return 200 and are not noindex", async ({
    request
  }) => {
    const bad: string[] = []
    const paths = sample(sitemapPaths(), 150, "sitemap-status")
    for (let i = 0; i < paths.length; i += 25) {
      await Promise.all(
        paths.slice(i, i + 25).map(async (p) => {
          const res = await request.get(p, { maxRedirects: 0 })
          const robots = res.headers()["x-robots-tag"] ?? ""
          if (res.status() !== 200 || /noindex/i.test(robots)) {
            bad.push(`${p} -> ${res.status()} ${robots}`)
          }
        })
      )
    }
    expect(bad).toEqual([])
  })
})

test.describe("machine-readable files", () => {
  for (const f of ["/llms.txt", "/llms.md"]) {
    test(`${f} serves text and its links resolve`, async ({ request }) => {
      const res = await request.get(f)
      expect(res.status()).toBe(200)
      expect(res.headers()["content-type"]).toMatch(/text\//)
      const body = await res.text()
      expect(body.trim().length).toBeGreaterThan(100)
      const links = [...body.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)]
        .map((m) => m[1])
        .filter((u) => u.startsWith(SITE))
      const bad: string[] = []
      for (const u of new Set(links)) {
        const r = await request.get(local(u), { maxRedirects: 0 })
        if (r.status() !== 200) bad.push(`${u} -> ${r.status()}`)
      }
      expect(bad).toEqual([])
    })
  }

  test("IndexNow key file is served and matches its name", async ({
    request
  }) => {
    const key = fs
      .readdirSync("public")
      .find((f) => /^[0-9a-f]{32}\.txt$/.test(f))
    expect(key, "no IndexNow key in public/").toBeTruthy()
    const res = await request.get(`/${key}`)
    expect(res.status()).toBe(200)
    expect((await res.text()).trim()).toBe(path.parse(key!).name)
  })

  for (const f of ["/favicon.ico", "/logo.png", "/og-image.png"]) {
    test(`${f} is served`, async ({ request }) => {
      expect((await request.get(f)).status()).toBe(200)
    })
  }
})

// Mirrors `redirects` in astro.config.mjs.
const REDIRECTS: [string, string][] = [
  ["/stars", "/timetable"],
  ["/mod", "/mods"],
  ["/help", "/faq"],
  ["/fgo", "/tools/fgo-optimiser"]
]

test.describe("redirects", () => {
  for (const [from, to] of REDIRECTS) {
    test(`${from} -> ${to} in one 301 hop`, async ({ request }) => {
      const res = await request.get(from, { maxRedirects: 0 })
      expect(res.status()).toBe(301)
      expect(local(res.headers().location)).toBe(to)
      const next = await request.get(to, { maxRedirects: 0 })
      expect(next.status()).toBe(200)
    })
  }

  test("lowercase module code redirects once to the canonical case", async ({
    request
  }) => {
    const res = await request.get("/mods/ee3011", { maxRedirects: 0 })
    expect(res.status()).toBe(301)
    expect(local(res.headers().location)).toBe("/mods/EE3011")
  })

  test("trailing slash does not create a duplicate or a chain", async ({
    request
  }) => {
    const res = await request.get("/mods/", { maxRedirects: 0 })
    if (res.status() === 200) {
      expect(await res.text()).toContain(`rel="canonical" href="${SITE}/mods"`)
    } else {
      // 307 is what Cloudflare's asset layer sends for the slash variant.
      expect([301, 307, 308]).toContain(res.status())
      const next = await request.get(local(res.headers().location), {
        maxRedirects: 0
      })
      expect(next.status()).toBe(200)
    }
  })
})

test.describe("404 handling", () => {
  const MISSING = [
    "/definitely-not-a-page",
    "/mods/ZZZ9999",
    "/mods/EE3011/1999/9",
    "/articles/definitely-not-an-article"
  ]
  test("missing pages are real 404s, noindex, with no canonical", async ({
    request
  }) => {
    for (const p of MISSING) {
      const res = await request.get(p, { maxRedirects: 0 })
      expect(res.status(), p).toBe(404)
      const html = await res.text()
      expect(html, p).toMatch(/<meta name="robots" content="noindex/)
      expect(html, p).not.toMatch(/rel="canonical"/)
      // set by 404.astro on real module pages; must never reach a real 404
      expect(res.headers()["x-module-snapshot"], p).toBeUndefined()
    }
  })
})
