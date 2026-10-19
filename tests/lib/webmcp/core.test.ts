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

  it("resolves plain values and never undefined", async () => {
    const { tools } = stubDocumentContext()
    registerTools(
      [def("a"), def("b"), def("c")],
      { a: () => ({ ok: 1 }), b: () => "hi", c: () => undefined },
      "/"
    )
    expect(await tools.get("a")!.execute({})).toEqual({ ok: 1 })
    expect(await tools.get("b")!.execute({})).toBe("hi")
    expect(await tools.get("c")!.execute({})).toEqual({ ok: true })
  })

  it("accepts JSON-string input as well as an object", async () => {
    const { tools } = stubDocumentContext()
    registerTools([def("a")], { a: (args) => args }, "/")
    expect(await tools.get("a")!.execute('{"x":1}' as never)).toEqual({ x: 1 })
    expect(await tools.get("a")!.execute({ y: 2 })).toEqual({ y: 2 })
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

  it("stays quiet when cleanup aborts the register promise", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.stubGlobal("window", {})
    vi.stubGlobal("document", {
      modelContext: {
        // As in the draft: aborting the signal rejects the register promise.
        registerTool: (_t: unknown, o: { signal: AbortSignal }) =>
          new Promise((_, reject) =>
            o.signal.addEventListener("abort", () => reject(o.signal.reason))
          )
      }
    })
    vi.stubGlobal("navigator", {})
    registerTools([def("a")], { a: () => 1 }, "/")()
    await new Promise((r) => setTimeout(r))
    expect(warn).not.toHaveBeenCalled()
  })

  it("returns tool errors as a result, because a rejection hides the reason", async () => {
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
    expect(await tools.get("known")!.execute({})).toEqual({
      error: "No module XX0000"
    })
    const hidden = JSON.stringify(await tools.get("bug")!.execute({}))
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
