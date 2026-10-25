import { setAnalyticsClient } from "@/lib/analytics"
import { consentState, onConsentChange, whenConsented } from "@/lib/consent"

const token = import.meta.env.PUBLIC_POSTHOG_TOKEN

// Errors thrown by scripts that browser extensions, in-app browsers and proxies
// inject into the page. They aren't from our code, so they only add noise to
// error tracking.
//
// Source: Sentry's "browser extensions" inbound filter, EXTENSION_EXC_VALUES
// (lines 10-61) and EXTENSION_EXC_SOURCES (lines 63-81), copied from
// https://github.com/getsentry/relay/blob/5b91b7b1ddb52bf58fc2e539a2b263fb94f3487b/relay-filter/src/browser_extensions.rs
// Pinned to that commit and frozen on purpose: it's a snapshot, not a live
// copy, so it only changes when we deliberately re-sync from a newer commit.
// Entries under "Not in Sentry's list" below are our own additions.
const INJECTED_MESSAGE = new RegExp(
  Object.freeze([
    // Random plugins/extensions
    "top\\.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    "http://tt\\.epicplay\\.com",
    "Can't\\sfind\\svariable:\\sZiteReader",
    "jigsaw\\sis\\snot\\sdefined",
    "ComboSearch\\sis\\snot\\sdefined",
    "http://loading\\.retry\\.widdit\\.com/",
    "atomicFindClose",
    // Facebook
    "fb_xd_fragment",
    // ISP "optimizing" proxies
    "bmi_SafeAddOnload",
    "EBCallBackMessageReceived",
    // Chrome on iOS
    "_gCrWeb",
    "conduitPage",
    // Google Search app (iOS)
    "null\\sis\\snot\\san\\sobject\\s\\(evaluating\\s'elt.parentNode'\\)",
    "Can't\\sfind\\svariable:\\sgmo",
    // Dragon Web Extension
    "plugin\\.setSuspendState\\sis\\snot\\sa\\sfunction",
    // Chrome extension message passing failure
    "Extension\\scontext\\sinvalidated",
    "webkit-masked-url:",
    // Firefox extension touching a removed DOM node
    "can't\\saccess\\sdead\\sobject",
    // Wallet and ad-block extensions
    "Cannot\\sredefine\\sproperty:\\s(solana|ethereum|googletag)",
    // Chrome on iOS translation
    "undefined\\sis\\snot\\san\\sobject\\s\\(evaluating\\s'a\\..'\\)",
    // Cross-origin access denied, usually extensions
    "Permission\\sdenied\\sto\\saccess\\sproperty\\s",
    // Not in Sentry's list (ours): wallet extensions assigning window.ethereum
    // (issue #311), and other in-app browser bridges
    "window\\.ethereum",
    "\\bselectedAddress\\b",
    // Chrome's cross-origin frame error (issue #318); we never touch frames
    "Blocked\\sa\\sframe\\swith\\sorigin\\s.*\\sfrom\\saccessing\\sa\\scross-origin\\sframe",
    // Stale chunk after a deploy (issue #322); StaleChunkReload.astro reloads
    // onto the new build, so the rejection itself carries no signal
    "Failed\\sto\\sfetch\\sdynamically\\simported\\smodule",
    "error\\sloading\\sdynamically\\simported\\smodule",
    "Importing\\sa\\smodule\\sscript\\sfailed",
    "_AutofillCallbackHandler",
    "window\\.webkit\\.messageHandlers",
    "Java\\sobject\\sis\\sgone"
  ]).join("|"),
  "i"
)
const INJECTED_SOURCE = new RegExp(
  Object.freeze([
    "graph\\.facebook\\.com",
    "connect\\.facebook\\.net",
    "eatdifferent\\.com\\.woopra-ns\\.com",
    "static\\.woopra\\.com/js/woopra\\.js",
    "^chrome(-extension)?://",
    "^moz-extension://",
    "^safari(-web)?-extension://",
    "webkit-masked-url",
    "127\\.0\\.0\\.1:4001/isrunning",
    "webappstoolbarba\\.texthelp\\.com/",
    "metrics\\.itunes\\.apple\\.com\\.edgesuite\\.net/",
    "kaspersky-labs\\.com"
  ]).join("|"),
  "i"
)

type ExceptionEntry = {
  value?: unknown
  stacktrace?: { frames?: { filename?: unknown }[] }
}

// Chrome on iOS injects a script that overflows the stack. It runs as an
// inline script, so its frame filename is the page URL, not a .js file
// (issue #325). Real stack overflows in our bundles keep a .js filename.
function isChromeIosInjectedOverflow(properties: Record<string, unknown>) {
  if (properties.$browser !== "Chrome iOS") return false
  const list = properties.$exception_list
  if (!Array.isArray(list)) return false
  return (list as ExceptionEntry[]).every((e) => {
    if (typeof e?.value !== "string" || !/call stack size/i.test(e.value))
      return false
    const top = e.stacktrace?.frames?.[0]?.filename
    return typeof top === "string" && !/\.m?js(\?|$)/.test(top)
  })
}

function isInjectedError(event: {
  event: string
  properties?: Record<string, unknown>
}) {
  if (event.event !== "$exception") return false
  if (event.properties && isChromeIosInjectedOverflow(event.properties))
    return true
  const list = event.properties?.$exception_list
  if (!Array.isArray(list)) return false
  return (list as ExceptionEntry[]).some((e) => {
    if (typeof e?.value === "string" && INJECTED_MESSAGE.test(e.value))
      return true
    // Like Sentry, judge by the throwing (last non-anonymous) frame, so an
    // extension further up the stack doesn't hide an error from our code.
    const frames = e?.stacktrace?.frames ?? []
    const last = frames.findLast(
      (f) =>
        typeof f?.filename === "string" &&
        f.filename !== "<anonymous>" &&
        f.filename !== "[native code]"
    )
    return (
      typeof last?.filename === "string" && INJECTED_SOURCE.test(last.filename)
    )
  })
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
