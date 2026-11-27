const KEY = "ntumods-consent"
const EVENT = "ntumods:consent"

export type Consent = "granted" | "denied"

let sessionChoice: Consent | undefined

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
  return getStoredConsent() === "granted"
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
