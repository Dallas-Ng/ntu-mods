import { describe, expect, it } from "vitest"

import { isNoise } from "@/astro/lib/posthog-client-init"

const exception = (
  value: string,
  frames: { filename?: unknown }[] = []
): { event: string; properties: Record<string, unknown> } => ({
  event: "$exception",
  properties: {
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
})
