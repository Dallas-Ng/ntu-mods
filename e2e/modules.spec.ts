/**
 * Module URL strategy (modules.spec.ts)
 *
 * Tests:  the current-versus-past module split, that /mods/CODE shows the
 *         latest offered semester, latest-semester and older-semester
 *         canonicals, the h1, Course JSON-LD only on current modules, and the
 *         sitemap policy for module URLs.
 * Why:    modules move between prerendered and on-demand every semester, and
 *         the URL, status and canonical of /mods/CODE must not change when
 *         they do.
 * How:    derives the expected result from the module data, then requests a
 *         sample of URLs without following redirects. The per-page checks for
 *         /mods/CODE itself (200, indexable, self-canonical) live in pages.spec.
 * Needs:  `pnpm build`, a running server and a seeded local D1.
 * Sample: SEO_SAMPLE modules per group for the canonical checks, 5 to 15 for
 *         the rest.
 */

import { expect, test } from "@playwright/test"

import {
  activeOfferingCodes,
  latestOfferings
} from "../src/lib/server/db/json-source"
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
// status and canonical of /mods/CODE must not change. The per-page checks for
// /mods/CODE itself (200, indexable, self-canonical, no snapshot header) live
// in pages.spec; this file covers what only it can: the current/past split,
// latest-semester canonicalisation and the sitemap policy.
const N = Number(process.env.SEO_SAMPLE || 20)

const offerings = latestOfferings()
// "Current" is by semester, not by what the build prerendered: CI caps the
// prerendered set (PRERENDER_MODULE_LIMIT) and the rest render on demand.
const activeCodes = new Set(activeOfferingCodes())
const current = offerings.filter((o) => activeCodes.has(o.code))
const past = offerings.filter((o) => !activeCodes.has(o.code))

const canonicalOf = (html: string) =>
  [...html.matchAll(/<link[^>]+rel="canonical"[^>]*>/g)].map(
    (m) => /href="([^"]*)"/.exec(m[0])?.[1]
  )

test.describe("module URL strategy", () => {
  test("test data has current and past-only modules", () => {
    expect(current.length).toBeGreaterThan(100)
    expect(past.length).toBeGreaterThan(100)
    // Every current module shares one semester.
    expect(new Set(current.map((o) => o.sem)).size).toBe(1)
    expect(past.some((o) => o.sem === current[0].sem)).toBe(false)
  })

  for (const [label, group] of [
    ["current-semester", current],
    ["past-only", past]
  ] as const) {
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

  test("h1 leads with the code and keeps the real title", async ({
    request
  }) => {
    const bad: string[] = []
    for (const o of sample([...current, ...past], 15, "mods-h1")) {
      const html = await (await request.get(`/mods/${o.code}`)).text()
      const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/
        .exec(html)?.[1]
        .replace(/<[^>]*>?/g, "")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim()
      if (
        !h1?.startsWith(o.code) ||
        !h1.includes(o.raw.title.replace(/\s+/g, " ").trim())
      )
        bad.push(`${o.code}: h1 "${h1}" vs title "${o.raw.title}"`)
    }
    expect(bad).toEqual([])
  })

  test("Course JSON-LD only on modules offered this semester", async ({
    request
  }) => {
    const hasCourse = async (code: string) =>
      /"@type":"Course"/.test(await (await request.get(`/mods/${code}`)).text())
    for (const o of sample(current, 5, "ld-current"))
      expect(await hasCourse(o.code), o.code).toBe(true)
    for (const o of sample(past, 5, "ld-past"))
      expect(await hasCourse(o.code), o.code).toBe(false)
  })

  test("older semester pages are self-canonical or fold into /mods/CODE", async ({
    request
  }) => {
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
      else if (
        c.length !== 1 ||
        ![
          `${SITE}${p}`,
          `${SITE}${p.split("/").slice(0, 3).join("/")}`
        ].includes(c[0] ?? "")
      )
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
})
