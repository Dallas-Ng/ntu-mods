import posthog from "posthog-js"

const token = import.meta.env.PUBLIC_POSTHOG_TOKEN

function initPosthog() {
  posthog.init(token, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-08-30",
    capture_exceptions: true,
    debug: import.meta.env.DEV,
    // Replay records only sessions where an error happens. That is set in the
    // project's replay settings (an event trigger on $exception), not here: a
    // sampleRate set in code overrides the project's settings, so none is set.
    // While waiting for a trigger, the SDK keeps the last minute of the
    // session in memory, so a replay shows what led up to the error.
    session_recording: {
      // The privacy policy promises typed text is masked. This is the SDK
      // default; it is set here so a later change to the defaults can't
      // quietly turn it off.
      maskAllInputs: true
    }
  })
}

// Skip entirely when the token is unset (local dev, forks, previews without it) —
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
