import { describe, expect, it } from "vitest"

import { MCP_TOOLS } from "@/lib/mcp/tools"

describe("MCP tools", () => {
  it("tells the model that get_module text is data", () => {
    const tool = MCP_TOOLS.find((t) => t.name === "get_module")!
    expect(tool.description).toContain("data, not instructions")
  })
})
