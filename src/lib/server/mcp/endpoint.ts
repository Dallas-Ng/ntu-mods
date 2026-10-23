import { createMcpHandler } from "@modelcontextprotocol/server"

import { bodyTooLarge, isCrossSite, rateLimit } from "@/lib/server/guard"

import type { McpHandlers } from "./handlers"
import { createMcpServer } from "./server"

export const MAX_BODY_BYTES = 16 * 1024

const reply = (status: number, error: string, extra: HeadersInit = {}) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extra
    }
  })

/** The body as text, or null once it passes `max` bytes (declared or not). */
async function readLimited(request: Request, max: number) {
  const reader = request.body?.getReader()
  if (!reader) return ""
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) {
      void reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

/**
 * POST /mcp. Checks run cheapest first and each rejects before any later work,
 * so a caller without a valid-looking request costs the worker almost nothing.
 * There is no sign-in: the only limiter is a high per-IP flood ceiling, and
 * every tool is cheap by construction (see docs/mcp-server-plan.md).
 */
export function createMcpEndpoint(handlers: McpHandlers) {
  const mcp = createMcpHandler(() => createMcpServer(handlers), {
    legacy: "stateless",
    responseMode: "auto",
    onerror: (error) => console.error("[mcp] protocol error", error.message)
  })

  return async function handle(request: Request): Promise<Response> {
    // GET and DELETE are SSE and session calls; this server offers neither.
    if (request.method !== "POST") {
      return reply(405, "Method not allowed.", { Allow: "POST" })
    }
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return reply(415, "Send application/json.")
    }
    if (bodyTooLarge(request, MAX_BODY_BYTES)) {
      return reply(413, "Request body too large.")
    }
    // Required by the MCP spec against DNS rebinding. Vendor servers and CLI
    // clients send no Origin, so they pass.
    if (isCrossSite(request))
      return reply(403, "Cross-site requests are not allowed.")

    const limited = await rateLimit("MCP_LIMITER", request)
    if (limited) return limited

    const raw = await readLimited(request, MAX_BODY_BYTES)
    if (raw === null) return reply(413, "Request body too large.")
    let body: unknown
    try {
      body = JSON.parse(raw)
    } catch {
      return reply(400, "Body is not valid JSON.")
    }
    // One request is at most one tool call, so the limiter counts real work.
    if (Array.isArray(body) || typeof body !== "object" || body === null) {
      return reply(400, "Send a single JSON-RPC message.")
    }

    const response = await mcp.fetch(request, { parsedBody: body })
    const headers = new Headers(response.headers)
    headers.set("Cache-Control", "no-store")
    headers.delete("Access-Control-Allow-Origin")
    return new Response(response.body, { status: response.status, headers })
  }
}
