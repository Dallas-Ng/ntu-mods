import { expect, test } from "./fixtures"
import { BASE_URL, pagesUnderTest } from "./lib/urls"

// Known third-party noise; keep this list short and justified.
const IGNORED: RegExp[] = []

// Theme is a client-side class toggle, so light only needs a few
// representative pages (home, a list page, a heavy island).
const LIGHT = new Set(["/", "/mods", "/timetable"])

// Pages with heavy client islands get a full network-idle wait; for the rest
// `load` plus two frames catches hydration errors without the idle timer.
const HEAVY = new Set([
  "/",
  "/timetable",
  "/mods",
  "/exams",
  "/tools/cgpa-planner",
  "/tools/fgo-optimiser"
])

const origin = new URL(BASE_URL).origin
// Console/network errors come from the template and its islands, not from
// per-page data, so a handful of each dynamic kind is enough.
const pages = pagesUnderTest(5, { semester: 3 })
const kinds = [...new Set(pages.map((p) => p.kind))]

// Grouped theme -> kind -> path, so a failure reads
// "Console and network errors > dark > module > /mods/X".
test.describe("Console and network errors", () => {
  for (const theme of ["dark", "light"] as const) {
    test.describe(theme, () => {
      for (const kind of kinds.filter(
        (k) =>
          theme === "dark" ||
          pages.some((p) => p.kind === k && LIGHT.has(p.path))
      )) {
        test.describe(kind, () => {
          for (const ref of pages.filter(
            (p) => p.kind === kind && (theme === "dark" || LIGHT.has(p.path))
          )) {
            test(ref.path, async ({ dark, light }) => {
              const problems: string[] = []
              const page = await (theme === "dark" ? dark : light).newPage()
              page.on("console", (m) => {
                if (m.type() !== "error" && m.type() !== "warning") return
                const where = m.location().url
                problems.push(
                  `console.${m.type()}: ${m.text()}${where ? ` (${where})` : ""}`
                )
              })
              page.on("pageerror", (e) =>
                problems.push(`pageerror: ${e.message}`)
              )
              page.on("requestfailed", (r) => {
                if (r.url().startsWith(origin)) {
                  problems.push(
                    `requestfailed: ${r.url()} ${r.failure()?.errorText}`
                  )
                }
              })
              page.on("response", (r) => {
                if (r.url().startsWith(origin) && r.status() >= 400) {
                  problems.push(`HTTP ${r.status()}: ${r.url()}`)
                }
              })

              await page.goto(new URL(ref.path, BASE_URL).toString())
              if (HEAVY.has(ref.path)) {
                await page
                  .waitForLoadState("networkidle", { timeout: 5_000 })
                  .catch(() => {})
              }
              // two frames: let hydration effects run and log before reading
              await page.evaluate(
                () =>
                  new Promise((r) =>
                    requestAnimationFrame(() => requestAnimationFrame(r))
                  )
              )
              await page.close()

              expect(
                problems.filter((p) => !IGNORED.some((re) => re.test(p)))
              ).toEqual([])
            })
          }
        })
      }
    })
  }
})
