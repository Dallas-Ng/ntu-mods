import { describe, expect, it } from "vitest"

import { mcpToolNotes } from "@/lib/developers/mcp-docs"
import { MCP_TOOL_NAMES } from "@/lib/mcp/tools"

describe("MCP docs notes", () => {
  it("has a note for every MCP tool and none for a missing one", () => {
    expect(Object.keys(mcpToolNotes).sort()).toEqual([...MCP_TOOL_NAMES].sort())
  })
})
