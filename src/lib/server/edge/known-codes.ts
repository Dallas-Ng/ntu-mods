import { env } from "cloudflare:workers"

/**
 * Every module code we have data for, from the build-time static file. Lets the
 * public module API turn away made-up codes without a D1 query, so the most an
 * attacker can make D1 do is one lookup per real module (cached for a week).
 * Memoised per isolate. Null if the file cannot be read, in which case callers
 * skip the check rather than reject real modules.
 */
let known: Promise<Set<string> | null> | undefined

async function load(origin: string): Promise<Set<string> | null> {
  try {
    const res = await env.ASSETS.fetch(`${origin}/data/api/module-codes.json`)
    if (!res.ok) return null
    const codes = (await res.json()) as string[]
    return codes.length ? new Set(codes) : null
  } catch {
    return null
  }
}

export async function getKnownCodes(origin: string) {
  known ??= load(origin)
  const codes = await known
  if (!codes) known = undefined // retry on the next request
  return codes
}
