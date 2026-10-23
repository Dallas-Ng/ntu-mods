import fs from "node:fs"
import path from "node:path"
import { expect, test } from "@playwright/test"

import { initialJs } from "./lib/budget"
import { DIST, sample, sitemapPaths } from "./lib/urls"

// No server needed: reads the built HTML and the chunks it pulls in up front
// (entry scripts, islands, their static imports). Dynamic imports are lazy and
// not counted. Measured today: 315-355 KB gzipped per page.
const BUDGET_KB = 400

// Heavy libraries that must stay behind dynamic imports.
const FORBIDDEN = /vendor-pdfjs|pdf\.worker|vendor-webllm/
const ARTICLE_ONLY = /vendor-photoswipe/

const builtPage = (p: string) =>
  path.join(DIST, p === "/" ? "index.html" : `${p}.html`)

const builtDir = (dir: string) =>
  fs
    .readdirSync(path.join(DIST, dir))
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
  test("there are built pages to measure", () => {
    expect(pages.length).toBeGreaterThan(10)
  })

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
      if (!p.startsWith("/articles/"))
        expect(
          files.filter((f) => ARTICLE_ONLY.test(f)),
          "article-only chunk"
        ).toEqual([])
    })
  }
})
