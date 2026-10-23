import { expect, test } from "@playwright/test"

import {
  BASE_URL,
  pagesUnderTest,
  sample,
  SITE,
  sitemapPaths
} from "./lib/urls"

const hrefsOf = (html: string) =>
  [...html.matchAll(/<a\b[^>]*?\bhref="([^"]*)"[^>]*>/g)].map((m) => ({
    tag: m[0],
    href: m[1]
  }))

// Internal path of an href, or null for external/non-navigational links.
const internal = (href: string, from: string) => {
  if (/^(mailto:|tel:|javascript:)/.test(href)) return null
  const u = new URL(href, new URL(from, BASE_URL))
  if (u.origin !== new URL(BASE_URL).origin && u.origin !== SITE) return null
  return u.pathname.length > 1 ? u.pathname.replace(/\/$/, "") : u.pathname
}

const inBatches = async <T>(
  items: T[],
  size: number,
  fn: (x: T) => Promise<void>
) => {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn))
  }
}

// One crawl of every sampled page plus all articles, shared by the tests below.
test.describe("crawl", () => {
  const pages = pagesUnderTest()
  const articlePaths = sitemapPaths().filter((p) =>
    /^\/articles\/[^/]+$/.test(p)
  )
  const html = new Map<string, string>()

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL: BASE_URL })
    const all = [...new Set([...pages.map((p) => p.path), ...articlePaths])]
    await inBatches(all, 20, async (p) => {
      html.set(p, await (await request.get(p)).text())
    })
    await request.dispose()
  })

  test("sampled titles and descriptions are unique", () => {
    const seen = new Map<string, string>()
    const dupes: string[] = []
    for (const { path: p } of pages) {
      const h = html.get(p) ?? ""
      const title = h.match(/<title>(.*?)<\/title>/s)?.[1]
      const desc = h.match(/<meta name="description" content="([^"]*)"/)?.[1]
      for (const [k, v] of [
        ["title", title],
        ["description", desc]
      ]) {
        const key = `${k}:${v}`
        if (!v) continue
        if (seen.has(key)) {
          dupes.push(`${k} shared by ${seen.get(key)} and ${p}: ${v}`)
        } else seen.set(key, p)
      }
    }
    expect(dupes).toEqual([])
  })

  test("internal links on sampled pages are clean and resolve", async ({
    playwright
  }) => {
    const request = await playwright.request.newContext({ baseURL: BASE_URL })
    const problems: string[] = []
    const targets = new Map<string, string>() // target -> first page linking it
    for (const { path: p } of pages) {
      for (const { tag, href } of hrefsOf(html.get(p) ?? "")) {
        if (href === "" || href === "#") {
          problems.push(`${p}: empty href ${tag.slice(0, 80)}`)
          continue
        }
        const target = internal(href, p)
        if (target && !targets.has(target)) targets.set(target, p)
      }
    }
    // Every distinct internal target answers 200 directly: a link that 3xx's
    // wastes crawl budget and one that 404s is a bug.
    // Module pages mostly render on demand (D1), so requesting every linked
    // one is slow; they are covered by the per-page and module specs. Check
    // every other target and a sample of module targets.
    const moduleTarget = /^\/mods\/[A-Z0-9]+(\/\d{4}\/[12ST])?$/
    const entries = [...targets]
    const toCheck = [
      ...entries.filter(([t]) => !moduleTarget.test(t)),
      ...sample(
        entries.filter(([t]) => moduleTarget.test(t)),
        40,
        "links-modules"
      )
    ]
    await inBatches(toCheck, 50, async ([t, from]) => {
      const r = await request.get(t, { maxRedirects: 0 })
      if (r.status() !== 200) problems.push(`${from}: ${t} -> ${r.status()}`)
    })
    await request.dispose()
    expect(problems).toEqual([])
  })

  test("no orphan articles or static pages", () => {
    const linked = (from: string[]) =>
      new Set(
        from.flatMap((p) =>
          hrefsOf(html.get(p) ?? "").flatMap(({ href }) => {
            const t = internal(href, p)
            return t && t !== p ? [t] : []
          })
        )
      )
    const statics = pages.filter((x) => x.kind === "static").map((x) => x.path)
    const anywhere = linked([...statics, ...articlePaths])
    const fromStatic = linked(statics)
    const problems = [
      ...articlePaths
        .filter((p) => !anywhere.has(p))
        .map((p) => `orphan article: ${p}`),
      ...statics
        .filter((p) => p !== "/" && !fromStatic.has(p))
        .map((p) => `orphan static page (no internal link): ${p}`)
    ]
    expect(problems).toEqual([])
  })
})
