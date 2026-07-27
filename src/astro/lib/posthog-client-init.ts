import posthog from "posthog-js"

const token = import.meta.env.PUBLIC_POSTHOG_TOKEN

function initPosthog() {
  posthog.init(token, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: import.meta.env.DEV,
    // 30% session recording sampling, as configured before the migration.
    session_recording: {
      sampleRate: 0.3
    }
  })
}

// Skip entirely when the token is unset (local dev, forks, preview builds) —
// initialising with an undefined token still wires up autocapture and fires
// requests at /ingest that can never be attributed to a project.
//
// Deferred off the initial render so PostHog's init work doesn't compete with
// hydration/LCP on first load.
if (token) {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(initPosthog)
  } else {
    setTimeout(initPosthog, 0)
  }
}
