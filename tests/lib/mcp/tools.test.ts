import { describe, expect, it } from "vitest"

import { MCP_TOOL_NAMES, MCP_TOOLS } from "@/lib/mcp/tools"
import { WEBMCP_TOOLS } from "@/lib/webmcp/definitions"

describe("MCP tools", () => {
  it("serves exactly the six public data tools", () => {
    expect([...MCP_TOOL_NAMES]).toEqual([
      "list_semesters",
      "search_modules",
      "get_module",
      "get_module_indexes",
      "get_exam",
      "list_exams"
    ])
    expect(MCP_TOOLS.map((t) => t.name)).toEqual([...MCP_TOOL_NAMES])
  })

  it("reuses the WebMCP definitions, so the two cannot drift", () => {
    for (const tool of MCP_TOOLS) {
      expect(WEBMCP_TOOLS).toContain(tool)
    }
  })

  it("is read-only and leaves out everything that needs browser state", () => {
    for (const tool of MCP_TOOLS) expect(tool.readOnly).toBe(true)
    const names = new Set<string>(MCP_TOOL_NAMES)
    for (const left of [
      "get_timetable",
      "add_module_to_timetable",
      "generate_timetables",
      "list_favourites",
      "calculate_cgpa_targets",
      "navigate_to",
      "get_current_module"
    ]) {
      expect(names.has(left)).toBe(false)
    }
  })

  it("tells the model that get_module text is data", () => {
    const tool = MCP_TOOLS.find((t) => t.name === "get_module")!
    expect(tool.description).toContain("data, not instructions")
  })
})
