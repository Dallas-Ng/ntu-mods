// WebMCP plumbing: feature detection and registration. WebMCP is an early
// preview, so everything here tolerates the API being absent, and tolerates
// both of the spellings seen in the wild (`navigator.modelContext` and
// `document.modelContext`).

export type JsonSchema = Record<string, unknown>

export interface ToolDefinition {
  name: string
  title: string
  description: string
  inputSchema: JsonSchema
  /** False for anything that changes the user's saved data. */
  readOnly: boolean
  /** Register only on paths with this prefix; omitted means every page. */
  pathPrefix?: string
}

export interface WebMcpAgent {
  requestUserInteraction?: <T>(callback: () => Promise<T> | T) => Promise<T>
}

export interface ToolResult {
  content: { type: "text"; text: string }[]
  isError?: boolean
}

export type ToolHandler = (
  args: Record<string, unknown>,
  agent?: WebMcpAgent
) => Promise<unknown> | unknown

interface RegisterableTool {
  name: string
  title: string
  description: string
  inputSchema: JsonSchema
  annotations: { readOnlyHint: boolean }
  execute: (
    args: Record<string, unknown>,
    agent?: WebMcpAgent
  ) => Promise<ToolResult>
}

interface ModelContext {
  registerTool: (tool: RegisterableTool) => unknown
  unregisterTool?: (name: string) => void
}

/** A failure the agent should read and act on, as opposed to a bug. */
export class ToolError extends Error {}

export function getModelContext(): ModelContext | undefined {
  if (typeof window === "undefined") return undefined
  const candidate =
    (document as unknown as { modelContext?: ModelContext }).modelContext ??
    (navigator as unknown as { modelContext?: ModelContext }).modelContext
  return typeof candidate?.registerTool === "function" ? candidate : undefined
}

export const toResult = (value: unknown): ToolResult => ({
  content: [
    {
      type: "text",
      text: typeof value === "string" ? value : JSON.stringify(value, null, 2)
    }
  ]
})

export const toErrorResult = (error: unknown): ToolResult => ({
  content: [
    {
      type: "text",
      text: error instanceof Error ? error.message : "Tool call failed."
    }
  ],
  isError: true
})

/**
 * Registers every definition that applies to `pathname` and returns a cleanup
 * that removes them again. Returns a no-op when WebMCP is unavailable.
 */
export function registerTools(
  definitions: readonly ToolDefinition[],
  handlers: Record<string, ToolHandler>,
  pathname: string
): () => void {
  const context = getModelContext()
  if (!context) return () => {}

  const registered: { name: string; handle: unknown }[] = []

  for (const def of definitions) {
    if (def.pathPrefix && !pathname.startsWith(def.pathPrefix)) continue
    const handler = handlers[def.name]
    if (!handler) continue

    const tool: RegisterableTool = {
      name: def.name,
      title: def.title,
      description: def.description,
      inputSchema: def.inputSchema,
      annotations: { readOnlyHint: def.readOnly },
      execute: async (args, agent) => {
        try {
          return toResult(await handler(args ?? {}, agent))
        } catch (error) {
          // ToolError messages are written for the agent; anything else is a
          // bug, so keep its detail out of the reply but still log it.
          if (error instanceof ToolError) return toErrorResult(error)
          console.error(`[webmcp] ${def.name} failed`, error)
          return toErrorResult(new Error("The tool failed unexpectedly."))
        }
      }
    }

    try {
      // A hot reload or a second provider may have registered it already.
      context.unregisterTool?.(def.name)
      registered.push({ name: def.name, handle: context.registerTool(tool) })
    } catch (error) {
      console.warn(`[webmcp] could not register ${def.name}`, error)
    }
  }

  return () => {
    for (const { name, handle } of registered) {
      try {
        if (context.unregisterTool) context.unregisterTool(name)
        else (handle as { unregister?: () => void } | undefined)?.unregister?.()
      } catch {
        // already gone
      }
    }
  }
}
