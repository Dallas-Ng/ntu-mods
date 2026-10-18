import { setAnalyticsClient } from "@/lib/analytics"

const token = import.meta.env.PUBLIC_POSTHOG_TOKEN

async function initPosthog() {
  // Imported here rather than at the top so the SDK is only downloaded once
  // the page has loaded. track() calls made before then are queued.
  const { default: posthog } = await import("posthog-js")
  posthog.init(token, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-08-30",
    capture_exceptions: true,
    debug: import.meta.env.DEV,
    disable_session_recording: true,
    loaded: (ph) => setAnalyticsClient(ph)
  })
}

// Skip entirely when the token is unset (local dev, forks, previews without it) —
// initialising with an undefined token still wires up autocapture and fires
// requests at /ingest that can never be attributed to a project.
//
// Waits for the window load event and then an idle moment, so PostHog never
// competes with the page's own loading, hydration or first interactions —
// the same deferral as GA in Analytics.astro.
if (token) {
  const schedule = () => {
    const run = () => void initPosthog().catch(() => setAnalyticsClient(null))
    if (typeof requestIdleCallback === "function") requestIdleCallback(run)
    else setTimeout(run, 0)
  }
  if (document.readyState === "complete") schedule()
  else window.addEventListener("load", schedule, { once: true })
} else {
  setAnalyticsClient(null)
}
