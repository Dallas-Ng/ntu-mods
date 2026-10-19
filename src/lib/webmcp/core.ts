// WebMCP plumbing: feature detection and registration, following the W3C
// Community Group draft (https://webmachinelearning.github.io/webmcp/):
//   document.modelContext.registerTool(tool, { signal })
// A tool is removed by aborting its signal; execute() receives the input
// object and resolves to the result, and a rejection reports an error.
//
// WebMCP is an early preview, so everything here tolerates the API being
// absent, and tolerates the older shape some builds still ship
// (`navigator.modelContext` and `unregisterTool(name)`).

export type JsonSchema = Record<string, unknown>

export interface ToolDefinition {
  name: string
  title: string
  description: string
  inputSchema: JsonSchema
  /** False for anything that changes the user's saved data. */
  readOnly: boolean
  /** Hard to undo: agents are told to confirm with the user first. */
  consequential?: boolean
  /** Returns text that came from outside the site, so agents treat it as data. */
  untrusted?: boolean
  /** Register only on paths with this prefix; omitted means every page. */
  pathPrefix?: string
}

export type ToolHandler = (
  args: Record<string, unknown>
) => Promise<unknown> | unknown

interface ToolAnnotations {
  readOnlyHint: boolean
  consequentialHint?: boolean
  untrustedContentHint?: boolean
}

interface RegisterableTool {
  name: string
  title: string
  description: string
  inputSchema: JsonSchema
  annotations: ToolAnnotations
  execute: (args: Record<string, unknown> | string) => Promise<unknown>
}

interface ModelContext {
  registerTool: (
    tool: RegisterableTool,
    options?: { signal?: AbortSignal }
  ) => unknown
  /** Older builds only; the draft removes tools through the signal instead. */
  unregisterTool?: (name: string) => void
}

/** A failure the agent should read and act on, as opposed to a bug. */
export class ToolError extends Error {
  name = "ToolError"
}

// Matched by name as well as by class: a hot-reloaded or duplicated copy of
// this module would otherwise make a ToolError look like an unexpected bug.
export const isToolError = (error: unknown): error is Error =>
  error instanceof ToolError ||
  (error as Error | undefined)?.name === "ToolError"

export function getModelContext(): ModelContext | undefined {
  if (typeof window === "undefined") return undefined
  const candidate =
    (document as unknown as { modelContext?: ModelContext }).modelContext ??
    (navigator as unknown as { modelContext?: ModelContext }).modelContext
  return typeof candidate?.registerTool === "function" ? candidate : undefined
}

/**
 * The browser JSON-serialises whatever execute() resolves to, so return plain
 * values (a string would arrive double-encoded) and never undefined, which is
 * an "unserializable result".
 */
export const normalise = (value: unknown): unknown => value ?? { ok: true }

/**
 * A rejected execute() reaches the agent only as "tool rejected": the reason
 * is not forwarded. Failures the agent can act on therefore resolve with an
 * error object instead of throwing.
 */
export const failure = (message: string) => ({ error: message })

export const toAnnotations = (def: ToolDefinition): ToolAnnotations => ({
  readOnlyHint: def.readOnly,
  ...(def.consequential ? { consequentialHint: true } : {}),
  ...(def.untrusted ? { untrustedContentHint: true } : {})
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

  const controller = new AbortController()
  const names: string[] = []

  for (const def of definitions) {
    if (def.pathPrefix && !pathname.startsWith(def.pathPrefix)) continue
    const handler = handlers[def.name]
    if (!handler) continue

    const tool: RegisterableTool = {
      name: def.name,
      title: def.title,
      description: def.description,
      inputSchema: def.inputSchema,
      annotations: toAnnotations(def),
      execute: async (input) => {
        try {
          // Chrome is deprecating JSON-string input; accept either for now.
          const args = typeof input === "string" ? JSON.parse(input) : input
          return normalise(await handler(args ?? {}))
        } catch (error) {
          if (isToolError(error)) return failure(error.message)
          // Anything else is a bug: log it, keep its detail from the agent.
          console.error(`[webmcp] ${def.name} failed`, error)
          return failure("The tool failed unexpectedly.")
        }
      }
    }

    const onFailure = (error: unknown) => {
      // Aborting the signal on cleanup rejects the register promise; expected.
      if (controller.signal.aborted) return
      console.warn(`[webmcp] could not register ${def.name}`, error)
    }

    try {
      // Older builds throw on a duplicate name; clear any leftover first.
      context.unregisterTool?.(def.name)
      // registerTool returns a promise in the draft, so a rejection must be
      // caught as well as a synchronous throw.
      Promise.resolve(
        context.registerTool(tool, { signal: controller.signal })
      ).catch(onFailure)
      names.push(def.name)
    } catch (error) {
      onFailure(error)
    }
  }

  return () => {
    controller.abort()
    for (const name of names) {
      try {
        context.unregisterTool?.(name)
      } catch {
        // already gone
      }
    }
  }
}
