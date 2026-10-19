import { describe, expect, it } from "vitest"

import { buildOpenApi } from "@/lib/openapi"

const spec = buildOpenApi({ indexSemester: "2026_2", examSemester: "2026_2" })
const paths = Object.keys(spec.paths)

describe("openapi", () => {
  it("only lists public routes", () => {
    for (const p of paths) {
      expect(p).toMatch(/^\/(api\/modules|data\/api|\.well-known|llms\.)/)
    }
  })

  it("leaves out internal routes and infrastructure details", () => {
    const text = JSON.stringify(spec).toLowerCase()
    for (const word of [
      "/api/feedback",
      "article-views",
      "/ingest",
      "d1",
      "limiter",
      "binding",
      "per ip",
      "per-ip"
    ]) {
      expect(text).not.toContain(word)
    }
    expect(JSON.stringify(spec)).not.toMatch(/\b\d+ requests\b/)
  })

  it("documents every module API status", () => {
    const responses = spec.paths["/api/modules/{code}"].get.responses
    expect(Object.keys(responses).sort()).toEqual([
      "200",
      "308",
      "400",
      "404",
      "429",
      "503"
    ])
  })
})
