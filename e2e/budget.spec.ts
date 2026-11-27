/**
 * Client JS budget (budget.spec.ts)
 *
 * Tests: how much JavaScript each page loads up front, and which heavy chunks
 * it pulls in. Why: a stray static import of pdfjs or the forms bundle, or a
 * creeping dependency, makes every page slower and nothing else fails. How:
 * reads the built HTML in dist/ and follows its entry scripts, client:load
 * islands and their static imports (lazy dynamic imports and
 * client:visible/idle islands are not counted), then sums gzip. Needs: `pnpm
 * build` only. No server is used. Sample: every built static page, plus 3
 * modules and 3 articles.
 */

import fs from "node:fs"
import path from "node:path"
import { expect, test } from "@playwright/test"

import { initialJs } from "./lib/budget"
import { DIST, sample, sitemapPaths } from "./lib/urls"

// No server needed: reads the built HTML and the chunks it pulls in up front
// (entry scripts, islands, their static imports). Dynamic imports are lazy and
// not counted, and neither are client:visible / idle islands (fetched later).
// Measured today: 298-337 KB gzipped per page.
const BUDGET_KB = 380

// Heavy libraries that must stay behind dynamic imports.
const FORBIDDEN = /vendor-pdfjs|pdf\.worker/

const DIST_ROOT = path.resolve(DIST)
const resolveInDist = (target: string) => {
  const resolved = path.resolve(DIST_ROOT, `.${path.sep}${target}`)
  const rel = path.relative(DIST_ROOT, resolved)
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path escapes DIST: ${target}`)
  }
  return resolved
}

const builtPage = (p: string) =>
  resolveInDist(p === "/" ? "index.html" : `${p}.html`)

const builtDir = (dir: string) =>
  fs
    .readdirSync(resolveInDist(dir))
    .filter((f) => f.endsWith(".html"))
    .map((f) => `/${dir}/${f.slice(0, -5)}`)

// Modules are partly on demand in CI, so sample what was actually built.
const pages = [
  ...sitemapPaths().filter(
    (p) => !/^\/(mods|articles)\/./.test(p) && fs.existsSync(builtPage(p))
  ),
  ...sample(builtDir("mods"), 3, "budget-mods"),
  ...sample(builtDir("articles"), 3, "budget-articles")
]

test.describe("client JS budget", () => {
  if (pages.length === 0) throw new Error("No built pages to measure")

  for (const p of pages) {
    test(p, () => {
      const { files, gzipBytes } = initialJs(builtPage(p))
      const kb = Math.round(gzipBytes / 1024)
      expect(
        files.length,
        "no scripts found, parser out of date?"
      ).toBeGreaterThan(0)
      expect(kb, `${kb} KB gzipped client JS`).toBeLessThanOrEqual(BUDGET_KB)
      expect(
        files.filter((f) => FORBIDDEN.test(f)),
        "heavy chunk loaded up front"
      ).toEqual([])
    })
  }
})
