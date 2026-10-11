import fs from "node:fs"
import path from "node:path"
import { expect, test } from "@playwright/test"

import { latestOfferings } from "../src/lib/server/db/json-source"
import { moduleYearCutoff } from "../src/lib/sitemap-policy"
import { sample, SITE, sitemapPaths } from "./lib/urls"

// SEO contract for module URLs:
//   /mods/CODE              the one evergreen URL per module. Always 200 and
//                           never redirected, always shows the module's most
//                           recently offered data (static when it is in the
//                           current semester, rendered on demand otherwise).
//   /mods/CODE/Y/S (latest) same data as /mods/CODE, so it canonicalises there.
//   /mods/CODE/Y/S (older)  archive page, self-canonical.
// A new semester only moves codes between "static" and "on demand"; the URL,
// status and canonical of /mods/CODE must not change.
const DIST = process.env.E2E_DIST || path.resolve("dist/client")
const N = Number(process.env.SEO_SAMPLE || 20)

const offerings = latestOfferings()
const staticCodes = new Set(
  fs
    .readdirSync(path.join(DIST, "mods"))
    .filter((f) => f.endsWith(".html"))
    .map((f) => f.slice(0, -5))
)
const current = offerings.filter((o) => staticCodes.has(o.code))
const past = offerings.filter((o) => !staticCodes.has(o.code))

const canonicalOf = (html: string) =>
  [...html.matchAll(/<link[^>]+rel="canonical"[^>]*>/g)].map(
    (m) => /href="([^"]*)"/.exec(m[0])?.[1]
  )
const noindex = (html: string, header: string) =>
  /<meta[^>]+name="robots"[^>]+noindex/i.test(html) || /noindex/i.test(header)

test.describe("module URL strategy", () => {
  test("test data has current and past-only modules", () => {
    expect(current.length).toBeGreaterThan(100)
    expect(past.length).toBeGreaterThan(100)
    // Every statically built module shares one (the current) semester.
    expect(new Set(current.map((o) => o.sem)).size).toBe(1)
    expect(past.some((o) => o.sem === current[0].sem)).toBe(false)
  })

  for (const [label, group] of [
    ["current-semester", current],
    ["past-only", past]
  ] as const) {
    test(`/mods/CODE for ${label} modules is 200, indexable, self-canonical`, async ({
      request
    }) => {
      const bad: string[] = []
      for (const o of sample(group, N, `mods-${label}`)) {
        const p = `/mods/${o.code}`
        const res = await request.get(p, { maxRedirects: 0 })
        const html = await res.text()
        const c = canonicalOf(html)
        if (res.status() !== 200) bad.push(`${p} -> ${res.status()}`)
        else if (noindex(html, res.headers()["x-robots-tag"] ?? ""))
          bad.push(`${p} noindex`)
        else if (c.length !== 1 || c[0] !== `${SITE}${p}`)
          bad.push(`${p} canonical ${c.join(",")}`)
      }
      expect(bad).toEqual([])
    })

    test(`${label} /mods/CODE shows the latest offered semester`, async ({
      request
    }) => {
      const bad: string[] = []
      for (const o of sample(group, 5, `mods-data-${label}`)) {
        const html = await (await request.get(`/mods/${o.code}`)).text()
        // Title carries the code and the page links the module's other
        // semesters; the "not offered" banner appears only for past-only.
        if (!html.includes(o.code)) bad.push(`${o.code} missing code`)
        const banner = html.includes("Not offered in the current semester")
        if (banner !== (group === past)) {
          bad.push(`${o.code} banner=${banner}`)
        }
      }
      expect(bad).toEqual([])
    })

    test(`${label} latest-offered semester page canonicalises to /mods/CODE`, async ({
      request
    }) => {
      const bad: string[] = []
      for (const o of sample(group, N, `mods-latest-${label}`)) {
        const p = `/mods/${o.code}/${o.year}/${o.semester}`
        const res = await request.get(p, { maxRedirects: 0 })
        const c = canonicalOf(await res.text())
        if (res.status() !== 200) bad.push(`${p} -> ${res.status()}`)
        else if (c.length !== 1 || c[0] !== `${SITE}/mods/${o.code}`)
          bad.push(`${p} canonical ${c.join(",")}`)
      }
      expect(bad).toEqual([])
    })
  }

  test("older semester pages are self-canonical", async ({ request }) => {
    const latest = new Set(
      offerings.map((o) => `/mods/${o.code}/${o.year}/${o.semester}`)
    )
    const older = sitemapPaths().filter(
      (p) => /^\/mods\/[^/]+\/\d{4}\/[12ST]$/.test(p) && !latest.has(p)
    )
    expect(older.length).toBeGreaterThan(0)
    const bad: string[] = []
    for (const p of sample(older, N, "mods-older")) {
      const res = await request.get(p, { maxRedirects: 0 })
      const c = canonicalOf(await res.text())
      if (res.status() !== 200) bad.push(`${p} -> ${res.status()}`)
      else if (c.length !== 1 || c[0] !== `${SITE}${p}`)
        bad.push(`${p} canonical ${c.join(",")}`)
    }
    expect(bad).toEqual([])
  })

  test("sitemap lists /mods/CODE for recently offered modules only, and no latest-semester duplicates", () => {
    const paths = new Set(sitemapPaths())
    const cutoff = moduleYearCutoff()
    const recent = offerings.filter((o) => Number(o.year) >= cutoff)
    const stale = offerings.filter((o) => Number(o.year) < cutoff)
    expect(recent.length).toBeGreaterThan(100)
    expect(stale.length).toBeGreaterThan(0)
    expect(recent.filter((o) => !paths.has(`/mods/${o.code}`))).toEqual([])
    // Stale pages stay live and indexable, just not advertised.
    expect(stale.filter((o) => paths.has(`/mods/${o.code}`))).toEqual([])
    const dupes = offerings
      .map((o) => `/mods/${o.code}/${o.year}/${o.semester}`)
      .filter((p) => paths.has(p))
    expect(dupes).toEqual([])
  })

  test("unknown modules and semesters 404 with noindex", async ({
    request
  }) => {
    for (const p of ["/mods/ZZZ9999", "/mods/EE3011/1999/9"]) {
      const res = await request.get(p, { maxRedirects: 0 })
      const html = await res.text()
      expect(res.status(), p).toBe(404)
      expect(noindex(html, res.headers()["x-robots-tag"] ?? ""), p).toBe(true)
      expect(res.headers()["x-module-snapshot"], p).toBeUndefined()
    }
  })

  test("internal snapshot header never leaks", async ({ request }) => {
    const o = past[0]
    const res = await request.get(`/mods/${o.code}`, { maxRedirects: 0 })
    expect(res.headers()["x-module-snapshot"]).toBeUndefined()
  })
})
