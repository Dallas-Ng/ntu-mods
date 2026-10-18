import { afterEach, describe, expect, it, vi } from "vitest"

import {
  registerTools,
  ToolError,
  type ToolDefinition
} from "@/lib/webmcp/core"

const def = (
  name: string,
  extra: Partial<ToolDefinition> = {}
): ToolDefinition => ({
  name,
  title: name,
  description: name,
  inputSchema: { type: "object" },
  readOnly: true,
  ...extra
})

const stubContext = () => {
  const tools = new Map<string, { execute: (a: object) => Promise<unknown> }>()
  const context = {
    registerTool: vi.fn((tool: { name: string; execute: never }) => {
      tools.set(tool.name, tool)
    }),
    unregisterTool: vi.fn((name: string) => void tools.delete(name))
  }
  vi.stubGlobal("window", {})
  vi.stubGlobal("document", { modelContext: context })
  vi.stubGlobal("navigator", {})
  return { context, tools }
}

describe("registerTools", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("does nothing when the browser has no WebMCP", () => {
    vi.stubGlobal("window", {})
    vi.stubGlobal("document", {})
    vi.stubGlobal("navigator", {})
    const cleanup = registerTools([def("a")], { a: () => 1 }, "/")
    expect(() => cleanup()).not.toThrow()
  })

  it("also finds navigator.modelContext", () => {
    const registerTool = vi.fn()
    vi.stubGlobal("window", {})
    vi.stubGlobal("document", {})
    vi.stubGlobal("navigator", { modelContext: { registerTool } })
    registerTools([def("a")], { a: () => 1 }, "/")
    expect(registerTool).toHaveBeenCalledTimes(1)
  })

  it("registers a tool, wraps its result and unregisters on cleanup", async () => {
    const { tools } = stubContext()
    const cleanup = registerTools([def("a")], { a: () => ({ ok: true }) }, "/")
    expect(await tools.get("a")!.execute({})).toEqual({
      content: [{ type: "text", text: JSON.stringify({ ok: true }, null, 2) }]
    })
    cleanup()
    expect(tools.size).toBe(0)
  })

  it("passes tool errors to the agent and hides unexpected ones", async () => {
    const { tools } = stubContext()
    vi.spyOn(console, "error").mockImplementation(() => {})
    registerTools(
      [def("known"), def("bug")],
      {
        known: () => {
          throw new ToolError("No module XX0000")
        },
        bug: () => {
          throw new Error("secret internals")
        }
      },
      "/"
    )
    expect(await tools.get("known")!.execute({})).toMatchObject({
      isError: true,
      content: [{ text: "No module XX0000" }]
    })
    const hidden = JSON.stringify(await tools.get("bug")!.execute({}))
    expect(hidden).toContain("failed unexpectedly")
    expect(hidden).not.toContain("secret")
  })

  it("registers path-scoped tools only on matching pages", () => {
    const { tools } = stubContext()
    const defs = [def("everywhere"), def("modsOnly", { pathPrefix: "/mods/" })]
    const handlers = { everywhere: () => 1, modsOnly: () => 1 }
    registerTools(defs, handlers, "/timetable")
    expect([...tools.keys()]).toEqual(["everywhere"])
    registerTools(defs, handlers, "/mods/SC1003")
    expect([...tools.keys()].sort()).toEqual(["everywhere", "modsOnly"])
  })

  it("skips a tool that has no handler", () => {
    const { tools } = stubContext()
    registerTools([def("orphan")], {}, "/")
    expect(tools.size).toBe(0)
  })
})
