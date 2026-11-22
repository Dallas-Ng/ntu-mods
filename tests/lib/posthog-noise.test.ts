import { describe, expect, it } from "vitest"

import { isNoise } from "@/astro/lib/posthog-client-init"

const exception = (
  value: string,
  frames: { filename?: unknown }[] = [],
  extraProperties: Record<string, unknown> = {}
): { event: string; properties: Record<string, unknown> } => ({
  event: "$exception",
  properties: {
    ...extraProperties,
    $exception_list: [
      {
        type: "Error",
        value,
        ...(frames.length > 0 ? { stacktrace: { frames } } : {})
      }
    ]
  }
})

describe("PostHog before_send filter", () => {
  it("drops a promise rejected with a DOM event (#344)", () => {
    expect(
      isNoise(
        exception("CustomEvent captured as exception with keys: isTrusted")
      )
    ).toBe(true)
  })

  it("drops a promise rejected with a bare object (#343)", () => {
    expect(
      isNoise(
        exception(
          "Object captured as exception with keys: [object has no keys]"
        )
      )
    ).toBe(true)
  })

  it("keeps a non-Error value that still has a stack", () => {
    expect(
      isNoise(
        exception("Object captured as exception with keys: reason", [
          { filename: "https://ntumods.com/_astro/index-abc123.js" }
        ])
      )
    ).toBe(false)
  })

  it("keeps real errors", () => {
    expect(
      isNoise(
        exception("Cannot read properties of undefined", [
          { filename: "https://ntumods.com/_astro/index-abc123.js" }
        ])
      )
    ).toBe(false)
  })

  it("drops errors thrown by injected scripts", () => {
    expect(
      isNoise(
        exception("Cannot redefine property: ethereum", [
          { filename: "https://ntumods.com/_astro/index-abc123.js" }
        ])
      )
    ).toBe(true)
  })

  it("leaves non-exception events alone", () => {
    const event = exception(
      "Object captured as exception with keys: [object has no keys]"
    )
    expect(isNoise({ ...event, event: "$pageview" })).toBe(false)
  })

  it("drops Google Search App iOS injected stack overflow (#380)", () => {
    expect(
      isNoise(
        exception(
          "Maximum call stack size exceeded.",
          [
            { filename: "https://ntumods.com/mods" },
            { filename: "https://ntumods.com/mods" }
          ],
          { $browser: "Google Search App", $os: "iOS" }
        )
      )
    ).toBe(true)
  })

  it("drops Chrome iOS injected stack overflow (#325), even with desktop UA", () => {
    expect(
      isNoise(
        exception(
          "Maximum call stack size exceeded.",
          [{ filename: "https://ntumods.com/timetable" }],
          { $browser: "Chrome iOS", $os: "Mac OS X" }
        )
      )
    ).toBe(true)
  })

  it("drops other iOS WKWebView injected stack overflows with native frames", () => {
    expect(
      isNoise(
        exception(
          "Maximum call stack size exceeded.",
          [
            { filename: "https://ntumods.com/mods" },
            { filename: "[native code]" }
          ],
          { $browser: "Mobile Safari", $os: "iOS" }
        )
      )
    ).toBe(true)
  })

  it("keeps real iOS stack overflows that include a bundle frame", () => {
    expect(
      isNoise(
        exception(
          "Maximum call stack size exceeded.",
          [
            { filename: "https://ntumods.com/mods" },
            { filename: "https://ntumods.com/_astro/mods-page.abc123.js" }
          ],
          { $browser: "Google Search App", $os: "iOS" }
        )
      )
    ).toBe(false)
  })

  it("keeps iOS stack overflows with no named frames", () => {
    expect(
      isNoise(
        exception(
          "Maximum call stack size exceeded.",
          [{ filename: "<anonymous>" }, { filename: "[native code]" }],
          { $browser: "Google Search App", $os: "iOS" }
        )
      )
    ).toBe(false)
  })

  it("keeps desktop stack overflows with page URL frames", () => {
    expect(
      isNoise(
        exception(
          "Maximum call stack size exceeded.",
          [{ filename: "https://ntumods.com/mods" }],
          { $browser: "Chrome", $os: "Mac OS X" }
        )
      )
    ).toBe(false)
  })

  it("keeps iOS exception events with an empty exception list", () => {
    expect(
      isNoise({
        event: "$exception",
        properties: { $os: "iOS", $browser: "Chrome iOS", $exception_list: [] }
      })
    ).toBe(false)
  })
})
