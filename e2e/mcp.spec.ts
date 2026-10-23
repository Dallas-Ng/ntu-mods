/**
 * MCP server (mcp.spec.ts)
 *
 * Tests:  /mcp answers a real tools/list and tools/call, turns away other
 *         methods, and /developers documents exactly the tools it serves.
 * Why:    the route runs in workerd with the real MCP SDK, which unit tests
 *         cannot cover, and the docs must not name tools the server lacks.
 * How:    plain HTTP requests (no browser) against the running server.
 * Needs:  `pnpm build`, a running server and a seeded local D1.
 */

import { expect, test } from "@playwright/test"

import { MCP_TOOL_NAMES } from "../src/lib/mcp/tools"

const headers = {
  "content-type": "application/json",
  accept: "application/json, text/event-stream"
}

const rpc = (method: string, params: object = {}) => ({
  headers,
  data: { jsonrpc: "2.0", id: 1, method, params }
})

/** The JSON-RPC message in a JSON or single-event SSE body. */
const parse = (body: string) =>
  JSON.parse(
    body.startsWith("event:")
      ? body
          .split("\n")
          .find((l) => l.startsWith("data:"))!
          .slice(5)
      : body
  )

test("lists exactly the documented tools", async ({ request }) => {
  const res = await request.post("/mcp", rpc("tools/list"))
  expect(res.status()).toBe(200)
  const names = parse(await res.text()).result.tools.map(
    (t: { name: string }) => t.name
  )
  expect(names).toEqual([...MCP_TOOL_NAMES])
})

test("runs a tool", async ({ request }) => {
  const res = await request.post(
    "/mcp",
    rpc("tools/call", { name: "list_semesters", arguments: {} })
  )
  const result = parse(await res.text()).result
  expect(JSON.parse(result.content[0].text).semesters.length).toBeGreaterThan(0)
})

test("answers GET with 405 and never caches", async ({ request }) => {
  const res = await request.get("/mcp")
  expect(res.status()).toBe(405)
  expect(res.headers()["cache-control"]).toBe("no-store")
})

test("/developers documents every MCP tool", async ({ request }) => {
  const html = await (await request.get("/developers")).text()
  for (const name of MCP_TOOL_NAMES) expect(html).toContain(name)
})
