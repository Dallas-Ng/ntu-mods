import { describe, expect, it } from "vitest"

import { buildAiCatalog, WEBMCP_MEDIA_TYPE } from "@/lib/ai-catalog"

const catalog = buildAiCatalog({
  indexSemester: "2026_2",
  examSemester: "2026_2",
  updatedAt: "2026-10-18T00:00:00.000Z"
})

describe("ai catalog", () => {
  it("declares the spec version and host", () => {
    expect(catalog.specVersion).toBe("1.0")
    expect(catalog.host.displayName).toBe("NTUMods")
  })

  it("gives every entry an identifier, a type and exactly one of url or data", () => {
    for (const entry of catalog.entries) {
      expect(entry.identifier).toBeTruthy()
      expect(entry.type).toMatch(/^[a-z]+\/[a-z0-9.+-]+$/)
      expect("url" in entry).toBe(true)
      expect("data" in entry).toBe(false)
    }
  })

  it("uses unique identifiers and absolute https urls", () => {
    const ids = catalog.entries.map((e) => e.identifier)
    expect(new Set(ids).size).toBe(ids.length)
    for (const entry of catalog.entries) {
      expect(entry.url).toMatch(/^https:\/\/ntumods\.com\//)
    }
  })

  it("points at the WebMCP tool list and the latest data files", () => {
    const byType = (type: string) =>
      catalog.entries.filter((e) => e.type === type)
    expect(byType(WEBMCP_MEDIA_TYPE)[0].url).toBe(
      "https://ntumods.com/.well-known/webmcp.json"
    )
    const urls = catalog.entries.map((e) => e.url)
    expect(urls).toContain("https://ntumods.com/data/api/indexes/2026_2.json")
    expect(urls).toContain("https://ntumods.com/data/api/exams/2026_2.json")
  })

  it("leaves out the exam dataset when no exams are published", () => {
    const without = buildAiCatalog({
      indexSemester: "2026_2",
      examSemester: null,
      updatedAt: "2026-10-18T00:00:00.000Z"
    })
    expect(without.entries.some((e) => e.url.includes("/exams/"))).toBe(false)
  })
})
