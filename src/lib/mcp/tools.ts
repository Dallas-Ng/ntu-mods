// The tools /mcp serves and /developers documents. They are WebMCP tools picked
// by name, so descriptions and input schemas have one source
// (webmcp/definitions.ts) and the three surfaces cannot drift. Everything left
// out reads or changes the user's browser state, which the server never has.

import { WEBMCP_TOOLS, type WebMcpToolName } from "@/lib/webmcp/definitions"

export const MCP_TOOL_NAMES = [
  "list_semesters",
  "search_modules",
  "get_module",
  "get_module_indexes",
  "get_exam",
  "list_exams"
] as const satisfies readonly WebMcpToolName[]

export type McpToolName = (typeof MCP_TOOL_NAMES)[number]

export const MCP_TOOLS = MCP_TOOL_NAMES.map((name) =>
  WEBMCP_TOOLS.find((tool) => tool.name === name)!
)
