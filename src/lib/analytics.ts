import type { PostHogInterface as PostHog, Properties } from "posthog-js"

import type { AnalyticsEvent } from "@/lib/analytics-events"

export type { AnalyticsEvent } from "@/lib/analytics-events"

// posthog-js is loaded after the page has finished loading
// (@/astro/lib/posthog-client-init), so it never competes with the page's own
// scripts. Until then, events wait here and are sent once it is ready. This
// file only imports PostHog's types, so importing track() doesn't pull the
// SDK into the page's initial download.
let client: PostHog | null = null
let queue: ((ph: PostHog) => void)[] | null = []
let resolveReady: (ph: PostHog | null) => void = () => {}
const ready = new Promise<PostHog | null>((resolve) => (resolveReady = resolve))

// Called by posthog-client-init: with the client once it has initialised, or
// with null when PostHog is off (no token), which drops anything queued.
export function setAnalyticsClient(ph: PostHog | null) {
  client = ph
  if (ph) for (const send of queue ?? []) send(ph)
  queue = null
  resolveReady(ph)
}

// The one place the client calls posthog.capture (eslint enforces it), so
// every event name is checked against ANALYTICS_EVENTS.
export function track(event: AnalyticsEvent, properties?: Properties) {
  if (client) client.capture(event, properties)
  else queue?.push((ph) => ph.capture(event, properties))
}

// Reports a caught error to PostHog error tracking, tagged with the feature it
// came from so it can be filtered there (`feature` property). Use it in every
// catch that swallows an error, so failures the user sees (or never sees) are
// visible to us. Never put personal data (transcript text, names) in properties.
export function reportError(
  feature: string,
  error: unknown,
  properties?: Properties
) {
  // Dropped connections (offline, tab closed, blocker) are not our bugs.
  if (
    error instanceof TypeError &&
    /^(Failed to fetch|Load failed|NetworkError)/.test(error.message)
  )
    return
  const props = { feature, ...properties }
  if (import.meta.env.DEV) console.error(`[${feature}]`, error, props)
  if (client) client.captureException(error, props)
  else queue?.push((ph) => ph.captureException(error, props))
}

// Resolves with PostHog once loaded, or null if it is off or takes longer
// than timeoutMs.
export function whenAnalyticsReady(timeoutMs: number): Promise<PostHog | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs)
  })
  return Promise.race([ready, timeout]).finally(() => clearTimeout(timer))
}
