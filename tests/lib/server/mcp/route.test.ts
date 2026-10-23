import { env } from "cloudflare:workers"
import { afterEach, describe, expect, it, vi } from "vitest"

import { createMcpEndpoint, MAX_BODY_BYTES } from "@/lib/server/mcp/endpoint"

import { setup } from "./fixtures"

const URL_ = "https://ntumods.com/mcp"

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request(URL_, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...headers
    },
    body: typeof body === "string" ? body : JSON.stringify(body)
  })

const META = {
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientInfo": { name: "modern-client", version: "1" },
  "io.modelcontextprotocol/clientCapabilities": {}
}

const modern = (method: string, params: object = {}, name?: string) =>
  post(
    { jsonrpc: "2.0", id: 1, method, params: { ...params, _meta: META } },
    {
      "mcp-protocol-version": "2026-07-28",
      "mcp-method": method,
      ...(name ? { "mcp-name": name } : {})
    }
  )

const call = (name: string, args: object = {}) =>
  modern("tools/call", { name, arguments: args }, name)

/** The JSON-RPC message in a JSON or single-event SSE response. */
async function message(res: Response) {
  const body = await res.text()
  const data = body.startsWith("event:")
    ? body
        .split("\n")
        .find((l) => l.startsWith("data:"))!
        .slice(5)
    : body
  return JSON.parse(data)
}

const toolText = async (res: Response) =>
  JSON.parse((await message(res)).result.content[0].text)

afterEach(() => {
  delete env.MCP_LIMITER
  delete env.MCP_DISABLED
  vi.restoreAllMocks()
})

const handle = () => createMcpEndpoint(setup().handlers)

describe("kill switch", () => {
  it("answers 503 before any other work when MCP_DISABLED is set", async () => {
    env.MCP_DISABLED = "1"
    const limit = vi.fn(async () => ({ success: true }))
    env.MCP_LIMITER = { limit }
    const res = await handle()(modern("tools/list"))
    expect(res.status).toBe(503)
    expect(res.headers.get("retry-after")).toBe("3600")
    expect(res.headers.get("cache-control")).toBe("no-store")
    expect(limit).not.toHaveBeenCalled()
  })

  it("serves again once the secret is removed", async () => {
    env.MCP_DISABLED = "1"
    delete env.MCP_DISABLED
    expect((await handle()(modern("tools/list"))).status).toBe(200)
  })
})

describe("request checks", () => {
  it.each(["GET", "DELETE", "PUT"])("answers %s with 405", async (method) => {
    const res = await handle()(new Request(URL_, { method }))
    expect(res.status).toBe(405)
    expect(res.headers.get("allow")).toBe("POST")
  })

  it("rejects a body that is not JSON", async () => {
    const res = await handle()(post("hi", { "content-type": "text/plain" }))
    expect(res.status).toBe(415)
  })

  it("rejects a declared body over the cap", async () => {
    const res = await handle()(
      post(
        { x: "y".repeat(MAX_BODY_BYTES) },
        {
          "content-length": String(MAX_BODY_BYTES + 1)
        }
      )
    )
    expect(res.status).toBe(413)
  })

  it("rejects an undeclared (streamed) body over the cap", async () => {
    const chunk = new TextEncoder().encode("x".repeat(MAX_BODY_BYTES))
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(chunk)
        controller.enqueue(chunk)
        controller.close()
      }
    })
    const res = await handle()(
      new Request(URL_, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: stream,
        duplex: "half"
      } as RequestInit)
    )
    expect(res.status).toBe(413)
  })

  it("rejects another site's Origin and allows ours or none", async () => {
    const h = handle()
    const bad = await h(
      post(
        { jsonrpc: "2.0", id: 1, method: "ping" },
        {
          origin: "https://evil.example"
        }
      )
    )
    expect(bad.status).toBe(403)
    const ours = await h(modern("tools/list"))
    expect(ours.status).toBe(200)
    const sameSite = await h(
      new Request(URL_, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://ntumods.com"
        },
        body: "{}"
      })
    )
    expect(sameSite.status).not.toBe(403)
  })

  it("returns 429 with Retry-After when the limiter says no", async () => {
    env.MCP_LIMITER = { limit: vi.fn(async () => ({ success: false })) }
    const res = await handle()(modern("tools/list"))
    expect(res.status).toBe(429)
    expect(res.headers.get("retry-after")).toBe("60")
  })

  it("does not limit when the binding is missing (local dev)", async () => {
    expect((await handle()(modern("tools/list"))).status).toBe(200)
  })

  it("keys the limiter by IP", async () => {
    const limit = vi.fn(async () => ({ success: true }))
    env.MCP_LIMITER = { limit }
    await handle()(
      new Request(URL_, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "cf-connecting-ip": "203.0.113.9"
        },
        body: "{}"
      })
    )
    expect(limit).toHaveBeenCalledWith({ key: "203.0.113.9" })
  })

  it("rejects invalid JSON, arrays and non-objects", async () => {
    const h = handle()
    expect((await h(post("{nope"))).status).toBe(400)
    expect(
      (await h(post([{ jsonrpc: "2.0", id: 1, method: "ping" }]))).status
    ).toBe(400)
    expect((await h(post("42"))).status).toBe(400)
  })

  it("never sets CORS headers and never allows caching", async () => {
    const res = await handle()(modern("tools/list"))
    expect(res.headers.get("access-control-allow-origin")).toBeNull()
    expect(res.headers.get("cache-control")).toBe("no-store")
    const rejected = await handle()(new Request(URL_))
    expect(rejected.headers.get("cache-control")).toBe("no-store")
  })
})

describe("protocol", () => {
  it("serves the six tools to a 2026 client", async () => {
    const msg = await message(await handle()(modern("tools/list")))
    expect(msg.result.tools.map((t: { name: string }) => t.name)).toEqual([
      "list_semesters",
      "search_modules",
      "get_module",
      "get_module_indexes",
      "get_exam",
      "list_exams"
    ])
  })

  it("serves a 2025 client that starts with initialize, with no session", async () => {
    const h = handle()
    const init = await h(
      post({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "legacy-client", version: "1" }
        }
      })
    )
    expect(init.status).toBe(200)
    expect(init.headers.get("mcp-session-id")).toBeNull()
    const list = await message(
      await h(
        post(
          { jsonrpc: "2.0", id: 2, method: "tools/list" },
          { "mcp-protocol-version": "2025-06-18" }
        )
      )
    )
    expect(list.result.tools).toHaveLength(6)
  })

  it("marks every tool read-only", async () => {
    const msg = await message(await handle()(modern("tools/list")))
    for (const tool of msg.result.tools) {
      expect(tool.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      })
    }
  })

  it("runs get_module through the tool call path", async () => {
    const res = await handle()(call("get_module", { code: "ab1000" }))
    expect(await toolText(res)).toMatchObject({
      code: "AB1000",
      url: "https://ntumods.com/mods/AB1000"
    })
  })

  it("returns tool failures as tool errors, not HTTP errors", async () => {
    const res = await handle()(call("get_module", { code: "ZZ9999" }))
    expect(res.status).toBe(200)
    const msg = await message(res)
    expect(msg.result.isError).toBe(true)
    expect(msg.result.content[0].text).toMatch(/No module ZZ9999/)
  })

  it("rejects arguments the schema does not allow", async () => {
    const res = await handle()(call("get_module", { code: "AB1000", extra: 1 }))
    const msg = await message(res)
    expect(msg.error ?? msg.result.isError).toBeTruthy()
  })
})

describe("logging", () => {
  const lines = (spy: { mock: { calls: unknown[][] } }) =>
    spy.mock.calls.map((c) => String(c[0]))

  it("writes one line per call without the arguments", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    await handle()(call("search_modules", { query: "secret-text-123" }))
    const out = lines(spy)
    expect(out).toHaveLength(1)
    expect(out[0]).not.toContain("secret-text-123")
    expect(JSON.parse(out[0])).toEqual({
      tool: "search_modules",
      status: "ok",
      ms: expect.any(Number),
      client: "modern-client"
    })
  })

  it("falls back to the User-Agent product and cuts it short", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    await handle()(
      post(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "list_semesters", arguments: {} }
        },
        { "user-agent": `${"A".repeat(60)}/1.2 (x)` }
      )
    )
    const entry = JSON.parse(lines(spy)[0])
    expect(entry.client).toBe("A".repeat(40))
  })

  it("logs failed calls as tool errors", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})
    await handle()(call("get_exam", { code: "AB1002" }))
    expect(JSON.parse(lines(spy)[0])).toMatchObject({
      tool: "get_exam",
      status: "tool_error"
    })
  })
})
