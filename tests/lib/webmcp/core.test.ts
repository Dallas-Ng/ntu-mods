import { afterEach, describe, expect, it, vi } from "vitest"

import {
  registerTools,
  toAnnotations,
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

type Registered = {
  annotations: object
  execute: (a: object) => Promise<unknown>
}

/** A stand-in for the draft API: tools leave when their signal aborts. */
const stubDocumentContext = () => {
  const tools = new Map<string, Registered>()
  const registerTool = vi.fn(
    async (
      tool: Registered & { name: string },
      options?: { signal?: AbortSignal }
    ) => {
      if (tools.has(tool.name)) throw new Error("duplicate")
      tools.set(tool.name, tool)
      options?.signal?.addEventListener("abort", () => tools.delete(tool.name))
    }
  )
  vi.stubGlobal("window", {})
  vi.stubGlobal("document", { modelContext: { registerTool } })
  vi.stubGlobal("navigator", {})
  return { registerTool, tools }
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

  it("also finds the older navigator.modelContext", () => {
    const registerTool = vi.fn()
    vi.stubGlobal("window", {})
    vi.stubGlobal("document", {})
    vi.stubGlobal("navigator", { modelContext: { registerTool } })
    registerTools([def("a")], { a: () => 1 }, "/")
    expect(registerTool).toHaveBeenCalledTimes(1)
  })

  it("returns structured results as JSON text", async () => {
    const { tools } = stubDocumentContext()
    registerTools(
      [def("a"), def("b")],
      { a: () => ({ ok: true }), b: () => "hi" },
      "/"
    )
    expect(await tools.get("a")!.execute({})).toBe(
      JSON.stringify({ ok: true }, null, 2)
    )
    expect(await tools.get("b")!.execute({})).toBe("hi")
  })

  it("removes its tools when cleaned up, via the abort signal", () => {
    const { tools } = stubDocumentContext()
    const cleanup = registerTools(
      [def("a"), def("b")],
      { a: () => 1, b: () => 1 },
      "/"
    )
    expect(tools.size).toBe(2)
    cleanup()
    expect(tools.size).toBe(0)
  })

  it("also calls unregisterTool on builds that still have it", () => {
    const unregisterTool = vi.fn()
    vi.stubGlobal("window", {})
    vi.stubGlobal("document", {
      modelContext: { registerTool: vi.fn(), unregisterTool }
    })
    vi.stubGlobal("navigator", {})
    registerTools([def("a")], { a: () => 1 }, "/")()
    expect(unregisterTool).toHaveBeenLastCalledWith("a")
  })

  it("survives registerTool rejecting or throwing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.stubGlobal("window", {})
    vi.stubGlobal("document", {
      modelContext: {
        registerTool: vi
          .fn()
          .mockRejectedValueOnce(new Error("rejected"))
          .mockImplementationOnce(() => {
            throw new Error("thrown")
          })
      }
    })
    vi.stubGlobal("navigator", {})
    expect(() =>
      registerTools([def("a"), def("b")], { a: () => 1, b: () => 1 }, "/")
    ).not.toThrow()
    await new Promise((r) => setTimeout(r))
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it("rejects with the message for tool errors and hides unexpected ones", async () => {
    const { tools } = stubDocumentContext()
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
    await expect(tools.get("known")!.execute({})).rejects.toThrow(
      "No module XX0000"
    )
    const hidden = await tools
      .get("bug")!
      .execute({})
      .catch((e: Error) => e.message)
    expect(hidden).toContain("failed unexpectedly")
    expect(hidden).not.toContain("secret")
  })

  it("registers path-scoped tools only on matching pages", () => {
    const { tools } = stubDocumentContext()
    const defs = [def("everywhere"), def("modsOnly", { pathPrefix: "/mods/" })]
    const handlers = { everywhere: () => 1, modsOnly: () => 1 }
    registerTools(defs, handlers, "/timetable")
    expect([...tools.keys()]).toEqual(["everywhere"])
  })

  it("skips a tool that has no handler", () => {
    const { tools } = stubDocumentContext()
    registerTools([def("orphan")], {}, "/")
    expect(tools.size).toBe(0)
  })

  it("passes the hints through as annotations", () => {
    expect(toAnnotations(def("a"))).toEqual({ readOnlyHint: true })
    expect(
      toAnnotations(
        def("b", { readOnly: false, consequential: true, untrusted: true })
      )
    ).toEqual({
      readOnlyHint: false,
      consequentialHint: true,
      untrustedContentHint: true
    })
  })
})
