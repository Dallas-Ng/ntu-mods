import { setAnalyticsClient } from "@/lib/analytics"
import { consentState, onConsentChange, whenConsented } from "@/lib/consent"

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
    loaded: (ph) => {
      // Init only runs once consent is granted, but an earlier withdrawal
      // may have left PostHog's own opt-out flag set.
      ph.opt_in_capturing()
      setAnalyticsClient(ph)
      // Withdrawing (or re-accepting) in the footer takes effect at once.
      onConsentChange((granted) =>
        granted ? ph.opt_in_capturing() : ph.opt_out_capturing()
      )
    }
  })
}

// Skip entirely when the token is unset (local dev, forks, previews without it) —
// initialising with an undefined token still wires up autocapture and fires
// requests at /ingest that can never be attributed to a project.
//
// Waits for the window load event and then an idle moment, so PostHog never
// competes with the page's own loading, hydration or first interactions —
// the same deferral as GA in Analytics.astro.
//
// Where consent is required, nothing is initialised or sent until the visitor
// accepts, and events tracked before then are dropped, not replayed.
if (token) {
  const schedule = () => {
    const run = () => void initPosthog().catch(() => setAnalyticsClient(null))
    if (typeof requestIdleCallback === "function") requestIdleCallback(run)
    else setTimeout(run, 0)
  }
  void consentState().then((state) => {
    if (state !== "granted") setAnalyticsClient(null)
  })
  const afterLoad = () => void whenConsented().then(schedule)
  if (document.readyState === "complete") afterLoad()
  else window.addEventListener("load", afterLoad, { once: true })
} else {
  setAnalyticsClient(null)
}
