import { describe, expect, it } from "vitest"

import { buildModuleMeta } from "@/lib/module-meta"
import type { DbModule } from "@/lib/server/db/types"

const mod = (over: Partial<DbModule>) =>
  ({ title: "Art As Commodity", au: 3, ...over }) as DbModule

describe("buildModuleMeta", () => {
  it("titles with code, name and AU", () => {
    expect(buildModuleMeta("AAA08A", mod({})).title).toBe(
      "AAA08A Art As Commodity (3 AU) | NTUMods"
    )
  })

  it("uses the module description, truncated, when present", () => {
    const long = "x".repeat(150)
    const { description } = buildModuleMeta(
      "AAA08A",
      mod({ description: long })
    )
    expect(description).toBe(`${"x".repeat(100)}…`)
  })

  it("fallback description is unique per module (code and title)", () => {
    const a = buildModuleMeta("AAA08A", mod({})).description
    const b = buildModuleMeta(
      "AAA08B",
      mod({ title: "Wearable Art" })
    ).description
    expect(a).not.toBe(b)
    expect(a).toContain("AAA08A")
    expect(a).toContain("Art As Commodity")
    expect(a.length).toBeGreaterThanOrEqual(50)
    expect(a.length).toBeLessThanOrEqual(170)
  })
})

describe("buildModuleMeta whitespace", () => {
  it("collapses newlines in the description", () => {
    const { description } = buildModuleMeta(
      "AAA08A",
      mod({ description: "line one\nline two\n\n  line three" })
    )
    expect(description).toBe("line one line two line three")
  })
})
