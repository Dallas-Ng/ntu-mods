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
// Tests are grouped check -> page kind -> path, so a failure reads as
// "Meta tags > article > /articles/x" and `-g "Meta tags"` reruns one check.
// All tests in a file share one worker, so each page loads once (cached).
interface Loaded {
  seo: SeoSnapshot
  status: number
  robotsHeader: string
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
          robotsHeader: (await res?.headerValue("x-robots-tag")) ?? ""
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

// Reported as a flat list of problems so the diff names every reason at once.
function check(
  name: string,
  run: (l: Loaded, ref: PageRef) => string[] | Promise<string[]>
) {
  test.describe(name, () => {
    for (const kind of kinds) {
      test.describe(kind, () => {
        for (const ref of pages.filter((p) => p.kind === kind)) {
          test(ref.path, async ({ noJs }) => {
            expect(await run(await load(noJs, ref), ref)).toEqual([])
          })
        }
      })
    }
  })
}

check("Responds 200 and is indexable", ({ status, robotsHeader }) => [
  ...(status === 200 ? [] : [`status ${status}`]),
  ...(/noindex/i.test(robotsHeader) ? [`x-robots-tag: ${robotsHeader}`] : [])
])

check("Meta tags", ({ seo }, ref) => {
  for (const w of warnings(seo)) {
    console.warn(`SEO warning ${ref.path}: ${w}`)
    test.info().annotations.push({ type: "warning", description: w })
  }
  return metaProblems(seo, ref)
})

// The same image is shared by many pages: fetch each URL once per worker.
const ogImages = new Map<string, Promise<string[]>>()
test.describe("og:image resolves to an image", () => {
  for (const kind of kinds) {
    test.describe(kind, () => {
      for (const ref of pages.filter((p) => p.kind === kind)) {
        test(ref.path, async ({ noJs, request }) => {
          const url = meta((await load(noJs, ref)).seo, "og:image")
          test.skip(!url, "missing og:image is reported under Meta tags")
          // Absolute URL points at the prod host; request the same path here.
          const local = new URL(url!).pathname
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
          expect(await ogImages.get(local)).toEqual([])
        })
      }
    })
  }
})

check("JSON-LD is valid and matches the page", ({ seo }, ref) =>
  jsonLdProblems(seo, ref)
)
check("Heading outline", ({ seo }) => headingProblems(seo))
check("Images and subresources", ({ seo }) => imageProblems(seo))
check("Renders real content without JS", ({ seo }, ref) =>
  contentProblems(seo, ref)
)
