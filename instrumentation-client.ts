import posthog from "posthog-js"

// Deferred off the initial render so PostHog's init work doesn't compete
// with hydration/LCP on first load.
function initPosthog() {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
    session_recording: {
      sampleRate: 0.3
    }
  })
}

if (typeof requestIdleCallback === "function") {
  requestIdleCallback(initPosthog)
} else {
  setTimeout(initPosthog, 0)
}
