// What the MCP docs page shows, derived from the same tool list /mcp registers,
// so the page cannot disagree with the server.

import { siteConfig } from "@/config/site"
import { MCP_TOOLS } from "@/lib/mcp/tools"

type Prop = { type?: string; enum?: string[]; description?: string }

export const mcpUrl = `${siteConfig.url}/mcp`

export const mcpTools = MCP_TOOLS.map((tool) => {
  const schema = tool.inputSchema as {
    properties: Record<string, Prop>
    required: string[]
  }
  return {
    name: tool.name,
    description: tool.description,
    inputs: Object.entries(schema.properties).map(([name, prop]) => ({
      name,
      type: prop.enum ? prop.enum.join(" | ") : (prop.type ?? "any"),
      required: schema.required.includes(name),
      description: prop.description ?? ""
    }))
  }
})

export const claudeCodeCommand = `claude mcp add --transport http ntumods ${mcpUrl}`

export const cursorConfig = JSON.stringify(
  { mcpServers: { ntumods: { url: mcpUrl } } },
  null,
  2
)
