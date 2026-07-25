import posthog from "posthog-js"

posthog.init(import.meta.env.PUBLIC_POSTHOG_TOKEN, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  debug: import.meta.env.DEV
})
