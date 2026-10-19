import { describe, expect, it } from "vitest"

import { WEBMCP_TOOLS } from "@/lib/webmcp/definitions"
import { webMcpHandlers } from "@/lib/webmcp/handlers"

describe("WebMCP tool definitions", () => {
  it("has a handler for every tool and a tool for every handler", () => {
    expect(Object.keys(webMcpHandlers).sort()).toEqual(
      WEBMCP_TOOLS.map((t) => t.name).sort()
    )
  })

  it("uses unique snake_case names", () => {
    const names = WEBMCP_TOOLS.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
    for (const name of names) expect(name).toMatch(/^[a-z][a-z0-9_]*$/)
  })

  it("describes every tool and gives it an object schema", () => {
    for (const tool of WEBMCP_TOOLS) {
      expect(tool.description.length).toBeGreaterThan(20)
      expect(tool.inputSchema).toMatchObject({ type: "object" })
    }
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

  it("never uses em dashes in copy an agent or user can read", () => {
    for (const tool of WEBMCP_TOOLS) {
      expect(JSON.stringify(tool)).not.toContain("—")
    }
  })
})
