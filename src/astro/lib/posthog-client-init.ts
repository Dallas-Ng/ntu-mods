import posthog from "posthog-js"

const token = import.meta.env.PUBLIC_POSTHOG_TOKEN

// Skip entirely when the token is unset (local dev, forks, preview builds) —
// initialising with an undefined token still wires up autocapture and fires
// requests at /ingest that can never be attributed to a project.
if (token) {
  posthog.init(token, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: import.meta.env.DEV
  })
}
