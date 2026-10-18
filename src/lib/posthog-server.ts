import { PostHog } from "posthog-node"

// A fresh client per call, deliberately not a module-scoped singleton. Callers
// shut the client down after capturing, and a Worker isolate is reused across
// many requests — a cached client would be shut down by the first request and
// silently drop every capture after it.
//
// No explicit host: posthog-node already defaults to https://us.i.posthog.com,
// the same instance /ingest proxies to.
export function createPostHogClient(token: string) {
  return new PostHog(token, {
    flushAt: 1,
    flushInterval: 0
  })
}

// Reports a server-side error to PostHog error tracking, flushed after the
// response via waitUntil. No-op without a token (local dev, forks).
export function reportServerError(
  token: string | undefined,
  waitUntil: (p: Promise<unknown>) => void,
  feature: string,
  error: unknown,
  properties?: Record<string, unknown>
) {
  console.error(`[${feature}]`, error)
  if (!token) return
  const posthog = createPostHogClient(token)
  posthog.captureException(error, "server", { feature, ...properties })
  waitUntil(posthog.shutdown())
}
