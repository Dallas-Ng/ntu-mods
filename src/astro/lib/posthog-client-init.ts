import { setAnalyticsClient } from "@/lib/analytics"
import { consentState, onConsentChange, whenConsented } from "@/lib/consent"

const token = import.meta.env.PUBLIC_POSTHOG_TOKEN

// Errors thrown by scripts that browser extensions and in-app browsers inject
// into the page. They aren't from our code, so they only add noise to error
// tracking. Crypto-wallet extensions, for one, assign to window.ethereum and
// throw on pages that never touch it.
const INJECTED_MESSAGE =
  /window\.ethereum|\bselectedAddress\b|_AutofillCallbackHandler|window\.webkit\.messageHandlers|__gCrWeb|Java object is gone/
const EXTENSION_FRAME = /^(chrome|moz|safari-web)-extension:\/\//

type ExceptionEntry = {
  value?: unknown
  stacktrace?: { frames?: { filename?: unknown }[] }
}

function isInjectedError(event: {
  event: string
  properties?: Record<string, unknown>
}) {
  if (event.event !== "$exception") return false
  const list = event.properties?.$exception_list
  if (!Array.isArray(list)) return false
  return (list as ExceptionEntry[]).some(
    (e) =>
      (typeof e?.value === "string" && INJECTED_MESSAGE.test(e.value)) ||
      e?.stacktrace?.frames?.some(
        (f) =>
          typeof f?.filename === "string" && EXTENSION_FRAME.test(f.filename)
      )
  )
}

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
    before_send: (event) => (event && isInjectedError(event) ? null : event),
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
