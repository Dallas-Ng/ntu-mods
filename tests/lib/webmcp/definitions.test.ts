import { describe, expect, it } from "vitest"

import { WEBMCP_TOOLS } from "@/lib/webmcp/definitions"

describe("WebMCP tool definitions", () => {
  it("uses unique names", () => {
    const names = WEBMCP_TOOLS.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it("requires only properties the schema declares", () => {
    for (const tool of WEBMCP_TOOLS) {
      const { properties, required } = tool.inputSchema as {
        properties: Record<string, unknown>
        required: string[]
      }
      for (const key of required) expect(properties).toHaveProperty(key)
    }
  })

  it("marks the destructive tools as consequential", () => {
    const flagged = WEBMCP_TOOLS.filter(
      (t) => "consequential" in t && t.consequential
    ).map((t) => t.name)
    expect(flagged.sort()).toEqual(["clear_plan", "load_shared_timetable"])
  })
})
