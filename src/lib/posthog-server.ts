import { PostHog } from "posthog-node"

let posthogClient: PostHog | null = null

export function getPostHogClient() {
  if (!posthogClient) {
    // No explicit host: posthog-node already defaults to
    // https://us.i.posthog.com, the same instance /ingest proxies to. This
    // previously read a NEXT_PUBLIC_POSTHOG_HOST that was never set, so the
    // default was what applied anyway.
    posthogClient = new PostHog(process.env.PUBLIC_POSTHOG_TOKEN!, {
      flushAt: 1,
      flushInterval: 0
    })
  }
  return posthogClient
}
