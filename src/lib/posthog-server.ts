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

// Last report time per feature, per isolate. An outage (D1 down) would
// otherwise send one exception per request. ponytail: per-isolate, so a busy
// deploy can still send one per isolate per window; fine at this traffic.
const lastReported = new Map<string, number>()
const REPORT_INTERVAL_MS = 60_000

// Reports a server-side error to PostHog error tracking, flushed after the
// response via waitUntil. No-op without a token (local dev, forks). At most
// one report per feature per minute per isolate.
export function reportServerError(
  token: string | undefined,
  waitUntil: (p: Promise<unknown>) => void,
  feature: string,
  error: unknown,
  properties?: Record<string, unknown>
) {
  console.error(`[${feature}]`, error)
  if (!token) return
  const now = Date.now()
  if (now - (lastReported.get(feature) ?? 0) < REPORT_INTERVAL_MS) return
  lastReported.set(feature, now)
  const posthog = createPostHogClient(token)
  posthog.captureException(error, "server", { feature, ...properties })
  waitUntil(posthog.shutdown())
}
