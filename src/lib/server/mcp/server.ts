import {
  CLIENT_INFO_META_KEY,
  fromJsonSchema,
  McpServer,
  type JsonSchemaType,
  type McpRequestContext
} from "@modelcontextprotocol/server"

import { MCP_TOOLS, type McpToolName } from "@/lib/mcp/tools"
import type { Args } from "@/lib/mcp/validate"
import { isToolError } from "@/lib/webmcp/core"

import type { McpHandlers } from "./handlers"

// Compiled once per isolate: the schemas never change between requests.
const schemas = new Map(
  MCP_TOOLS.map((t) => [
    t.name,
    fromJsonSchema(t.inputSchema as JsonSchemaType)
  ])
)

const text = (value: string, isError = false) => ({
  content: [{ type: "text" as const, text: value }],
  ...(isError ? { isError: true } : {})
})

/**
 * One log line per call. Never the arguments: search queries are free text
 * typed by students. `client` is the MCP client name, else the User-Agent
 * product, cut short so it cannot bloat the logs.
 */
export function logCall(
  tool: string,
  status: "ok" | "tool_error" | "error",
  ms: number,
  client: string | undefined
) {
  console.log(
    JSON.stringify({ tool, status, ms, client: (client ?? "").slice(0, 40) })
  )
}

/** A fresh server per request, as stateless serving needs. */
export function createMcpServer(handlers: McpHandlers) {
  const server = new McpServer({ name: "ntumods", version: "1.0.0" })

  for (const tool of MCP_TOOLS) {
    const run = handlers[tool.name as McpToolName] as (a: Args) => unknown

    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: schemas.get(tool.name)!,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        }
      },
      async (args, ctx) => {
        const started = Date.now()
        const client =
          (
            (ctx.mcpReq.envelope as Record<string, unknown> | undefined)?.[
              CLIENT_INFO_META_KEY
            ] as { name?: string } | undefined
          )?.name ?? ctx.http?.req?.headers.get("user-agent")?.split(/[\s/]/)[0]
        try {
          const result = await run((args ?? {}) as Args)
          logCall(tool.name, "ok", Date.now() - started, client)
          return text(JSON.stringify(result))
        } catch (error) {
          if (isToolError(error)) {
            logCall(tool.name, "tool_error", Date.now() - started, client)
            return text(error.message, true)
          }
          console.error(`[mcp] ${tool.name} failed`, error)
          logCall(tool.name, "error", Date.now() - started, client)
          return text("The tool failed unexpectedly.", true)
        }
      }
    )
  }
  return server
}

export type { McpRequestContext }
