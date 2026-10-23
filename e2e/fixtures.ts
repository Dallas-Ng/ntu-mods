/**
 * Browser contexts (fixtures.ts)
 *
 * Provides: worker-scoped contexts for the specs that drive a browser: `noJs`
 *           (documents only, what crawlers see), `dark` and `light`.
 * Why:      one context per worker instead of one per test, and third-party
 *           hosts are stubbed so analytics and consent calls cannot flake CI.
 * Used by:  pages.spec.ts and runtime.spec.ts.
 */

import { test as base, type BrowserContext } from "@playwright/test"

import { BASE_URL } from "./lib/urls"

// One context per worker instead of one per test: context setup was a visible
// slice of the run. Tests open (and close) their own pages.
interface WorkerFixtures {
  /** JS off, documents only: what crawlers that skip JS see. */
  noJs: BrowserContext
  dark: BrowserContext
  light: BrowserContext
}

const themed =
  (theme: "dark" | "light") =>
  async (
    { browser }: { browser: import("@playwright/test").Browser },
    use: (c: BrowserContext) => Promise<void>
  ) => {
    const ctx = await browser.newContext()
    await ctx.addInitScript((t) => {
      try {
        localStorage.setItem("theme", t)
      } catch {}
    }, theme)
    // Analytics/consent hosts are not ours to test and make CI flaky: answer
    // every cross-origin request with an empty 200.
    const origin = new URL(BASE_URL).origin
    await ctx.route(
      (u) => u.origin !== origin,
      (route) =>
        route.fulfill({
          status: 200,
          body: "",
          contentType:
            route.request().resourceType() === "script"
              ? "application/javascript"
              : "text/plain"
        })
    )
    await use(ctx)
    await ctx.close()
  }

export const test = base.extend<object, WorkerFixtures>({
  noJs: [
    async ({ browser }, use) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false })
      // Checks read attributes and text only; skip images, CSS and fonts.
      await ctx.route("**/*", (r) =>
        r.request().resourceType() === "document" ? r.continue() : r.abort()
      )
      await use(ctx)
      await ctx.close()
    },
    { scope: "worker" }
  ],
  dark: [themed("dark"), { scope: "worker" }],
  light: [themed("light"), { scope: "worker" }]
})

export { expect } from "@playwright/test"
