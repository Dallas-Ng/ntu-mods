import { expect, test } from "./fixtures"
import {
  contentProblems,
  headingProblems,
  imageProblems,
  jsonLdProblems,
  meta,
  metaProblems,
  readSeo,
  warnings,
  type SeoSnapshot
} from "./lib/seo"
import { BASE_URL, pagesUnderTest, type PageRef } from "./lib/urls"

// JS is off on purpose: what renders here is what crawlers that skip JS see,
// so meta, JSON-LD, headings and body copy must all be server-rendered.
//
interface Loaded {
  seo: SeoSnapshot
  status: number
  robotsHeader: string
  snapshotHeader: string
}
const loaded = new Map<string, Promise<Loaded>>()

const load = (
  noJs: import("@playwright/test").BrowserContext,
  ref: PageRef
): Promise<Loaded> => {
  if (!loaded.has(ref.path)) {
    loaded.set(
      ref.path,
      (async () => {
        const page = await noJs.newPage()
        const res = await page.goto(new URL(ref.path, BASE_URL).toString(), {
          waitUntil: "domcontentloaded"
        })
        const out = {
          seo: await readSeo(page),
          status: res?.status() ?? 0,
          robotsHeader: (await res?.headerValue("x-robots-tag")) ?? "",
          snapshotHeader: (await res?.headerValue("x-module-snapshot")) ?? ""
        }
        await page.close()
        return out
      })()
    )
  }
  return loaded.get(ref.path)!
}

const pages = pagesUnderTest()
const kinds = [...new Set(pages.map((p) => p.kind))]

// One test per page runs every check, each as a soft assertion labelled with
// its name: the page loads once, and a failure still names the page and every
// check that failed, e.g. "Meta tags" under "article > /articles/x".
const ogImages = new Map<string, Promise<string[]>>() // shared by many pages

const checks: Array<
  [string, (l: Loaded, ref: PageRef) => string[] | Promise<string[]>]
> = [
  [
    "Responds 200 and is indexable",
    ({ status, robotsHeader, snapshotHeader }) => [
      ...(status === 200 ? [] : [`status ${status}`]),
      ...(/noindex/i.test(robotsHeader)
        ? [`x-robots-tag: ${robotsHeader}`]
        : []),
      // set by 404.astro on real module pages; must not leak into a 200
      ...(snapshotHeader ? [`leaks x-module-snapshot: ${snapshotHeader}`] : [])
    ]
  ],
  [
    "Meta tags",
    ({ seo }, ref) => {
      for (const w of warnings(seo)) {
        console.warn(`SEO warning ${ref.path}: ${w}`)
        test.info().annotations.push({ type: "warning", description: w })
      }
      return metaProblems(seo, ref)
    }
  ],
  [
    "JSON-LD is valid and matches the page",
    ({ seo }, ref) => jsonLdProblems(seo, ref)
  ],
  ["Heading outline", ({ seo }) => headingProblems(seo)],
  ["Images and subresources", ({ seo }) => imageProblems(seo)],
  [
    "Renders real content without JS",
    ({ seo }, ref) => contentProblems(seo, ref)
  ]
]

for (const kind of kinds) {
  test.describe(kind, () => {
    for (const ref of pages.filter((p) => p.kind === kind)) {
      test(ref.path, async ({ noJs, request }) => {
        const loadedPage = await load(noJs, ref)
        for (const [name, run] of checks) {
          expect.soft(await run(loadedPage, ref), name).toEqual([])
        }

        // og:image must resolve to an image; each URL is fetched once per worker.
        const url = meta(loadedPage.seo, "og:image")
        if (url) {
          // Absolute URL points at the prod host; request the same path here.
          const local = new URL(url).pathname
          if (!ogImages.has(local)) {
            ogImages.set(
              local,
              request.get(local).then((r) => {
                const type = r.headers()["content-type"] ?? ""
                return [
                  ...(r.status() === 200 ? [] : [`${local} -> ${r.status()}`]),
                  ...(type.startsWith("image/")
                    ? []
                    : [`${local} content-type ${type}`])
                ]
              })
            )
          }
          expect
            .soft(await ogImages.get(local), "og:image resolves")
            .toEqual([])
        }
      })
    }
  })
}
