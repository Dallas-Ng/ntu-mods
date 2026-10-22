// Analytics consent. Visitors from regions that require opt-in (see
// @/lib/consent-regions) must accept before any analytics tool loads;
// everywhere else analytics run as before and no banner is shown.
//
// The visitor's choice lives in localStorage. Whether their region needs one
// is asked of /api/consent-region (the page is prerendered, so the country
// is only known at the edge) and cached for the session. If that lookup
// fails, consent is treated as required.
const KEY = "ntumods-consent"
const REGION_KEY = "ntumods-consent-required"
const EVENT = "ntumods:consent"

export type Consent = "granted" | "denied"

export function getStoredConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === "granted" || v === "denied" ? v : null
  } catch {
    return null
  }
}

export function setConsent(value: Consent) {
  try {
    localStorage.setItem(KEY, value)
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }))
}

let region: Promise<boolean> | undefined

export function consentRequired(): Promise<boolean> {
  region ??= (async () => {
    try {
      const cached = sessionStorage.getItem(REGION_KEY)
      if (cached) return cached === "1"
    } catch {}
    try {
      const res = await fetch("/api/consent-region", { cache: "no-store" })
      if (!res.ok) throw new Error(String(res.status))
      const { required } = await res.json()
      try {
        sessionStorage.setItem(REGION_KEY, required ? "1" : "0")
      } catch {}
      return required !== false
    } catch {
      return true
    }
  })()
  return region
}

/** "pending" means the banner is (or will be) showing and nothing is allowed yet. */
export async function consentState(): Promise<Consent | "pending"> {
  const stored = getStoredConsent()
  if (stored) return stored
  return (await consentRequired()) ? "pending" : "granted"
}

export function onConsentChange(cb: (granted: boolean) => void) {
  const handler = (e: Event) =>
    cb((e as CustomEvent<Consent>).detail === "granted")
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}

/** Resolves once analytics are allowed, immediately if they already are. */
export async function whenConsented(): Promise<void> {
  if ((await consentState()) === "granted") return
  await new Promise<void>((resolve) => {
    const off = onConsentChange((granted) => {
      if (!granted) return
      off()
      resolve()
    })
  })
}
