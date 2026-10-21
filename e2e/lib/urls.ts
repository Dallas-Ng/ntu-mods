import fs from "node:fs"
import path from "node:path"

/** Canonical origin the built pages and sitemap advertise. */
export const SITE = process.env.SITE_URL || "https://ntumods.com"
/** Server under test; also what playwright.config.ts points at. */
export const BASE_URL =
  process.env.E2E_BASE_URL || `http://localhost:${process.env.E2E_PORT || 4399}`
const DIST = process.env.E2E_DIST || path.resolve("dist/client")
const SAMPLE = Number(process.env.SEO_SAMPLE || 20)
const SEED = process.env.SEO_SEED || "1"

export type Kind = "static" | "article" | "module" | "semester"

export interface PageRef {
  path: string
  kind: Kind
}

/** Every sitemap URL as a pathname. Needs `pnpm build` (build-sitemap.mts). */
export function sitemapPaths(): string[] {
  const files = fs.readdirSync(DIST).filter((f) => /^sitemap-\d+\.xml$/.test(f))
  if (!files.length) {
    throw new Error(`No sitemap-*.xml in ${DIST}; run pnpm build first`)
  }
  return files.flatMap((f) =>
    [...fs.readFileSync(path.join(DIST, f), "utf8").matchAll(/<loc>([^<]+)</g)]
      .map((m) => new URL(m[1]).pathname)
      .map((p) => (p.length > 1 ? p.replace(/\/$/, "") : p))
  )
}

const kindOf = (p: string): Kind | null => {
  if (/^\/llms\.(txt|md)$/.test(p)) return null // not HTML
  if (/^\/articles\/[^/]+$/.test(p)) return "article"
  if (/^\/mods\/[^/]+$/.test(p)) return "module"
  if (/^\/mods\/[^/]+\/\d{4}\/[12ST]$/.test(p)) return "semester"
  return "static"
}

// mulberry32 over a string seed: deterministic, so a failing sample reproduces.
function rng(seed: string) {
  let a = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function sample<T>(items: T[], n: number, seed = SEED): T[] {
  const rand = rng(seed)
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out.slice(0, n)
}

/** All static pages, plus `perKind` random pages of each dynamic route. */
export function pagesUnderTest(perKind = SAMPLE): PageRef[] {
  const byKind: Record<Kind, string[]> = {
    static: [],
    article: [],
    module: [],
    semester: []
  }
  for (const p of sitemapPaths()) {
    const kind = kindOf(p)
    if (kind) byKind[kind].push(p)
  }
  return (Object.keys(byKind) as Kind[]).flatMap((kind) =>
    (kind === "static" ? byKind.static : sample(byKind[kind], perKind)).map(
      (p) => ({ path: p, kind })
    )
  )
}
