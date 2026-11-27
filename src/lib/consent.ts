const KEY = "ntumods-consent"
const EVENT = "ntumods:consent"

export type Consent = "granted" | "denied"

const REGION_KEY = "ntumods-consent-default"

let sessionChoice: Consent | undefined
// Singapore visitors with no saved choice are on by default. `null` until the
// lookup finishes, and for visitors outside Singapore.
let regionDefault: Consent | null = null
let regionResolved = false

export function getStoredConsent(): Consent | null {
  try {
    const value = localStorage.getItem(KEY)
    return (
      sessionChoice ??
      (value === "granted" || value === "denied" ? value : null)
    )
  } catch {
    return sessionChoice ?? null
  }
}

export function hasAnalyticsConsent() {
  return (getStoredConsent() ?? regionDefault) === "granted"
}

/** True once we know the visitor must pick, so the banner can show. */
export function needsConsentChoice() {
  return getStoredConsent() === null && regionResolved && regionDefault === null
}

function resolveRegion(defaultOn: boolean) {
  regionResolved = true
  regionDefault = defaultOn ? "granted" : null
  window.dispatchEvent(new Event(EVENT))
}

// The pages are prerendered, so the country is only known at the edge. Asked
// once per session, and only when the visitor has not chosen. If the lookup
// fails, they are asked.
if (typeof window !== "undefined" && getStoredConsent() === null) {
  let cached: string | null = null
  try {
    cached = sessionStorage.getItem(REGION_KEY)
  } catch {}
  if (cached) queueMicrotask(() => resolveRegion(cached === "1"))
  else
    void fetch("/api/consent-region")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(({ defaultOn }: { defaultOn?: boolean }) => {
        try {
          sessionStorage.setItem(REGION_KEY, defaultOn ? "1" : "0")
        } catch {}
        resolveRegion(defaultOn === true)
      })
      .catch(() => resolveRegion(false))
}

export function setConsent(value: Consent) {
  try {
    localStorage.setItem(KEY, value)
    sessionChoice = undefined
  } catch {
    sessionChoice = value
  }
  window.dispatchEvent(new Event(EVENT))
}

export function onConsentChange(callback: (granted: boolean) => void) {
  const notify = () => callback(hasAnalyticsConsent())
  const onStorage = (event: StorageEvent) => {
    if (
      event.storageArea === localStorage &&
      (event.key === KEY || event.key === null)
    ) {
      sessionChoice = undefined
      notify()
    }
  }
  window.addEventListener(EVENT, notify)
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(EVENT, notify)
    window.removeEventListener("storage", onStorage)
  }
}

/** Run once, when analytics have been explicitly accepted. */
export function whenConsented(callback: () => void) {
  if (hasAnalyticsConsent()) {
    callback()
    return () => {}
  }
  const unsubscribe = onConsentChange((granted) => {
    if (!granted) return
    unsubscribe()
    callback()
  })
  return unsubscribe
}
