"use client"

import { useEffect, useState } from "react"

import { consentRequired, getStoredConsent, setConsent } from "@/lib/consent"
import { Button } from "@/components/ui/button"

const OPEN_EVENT = "ntumods:open-consent"

// Shown only to visitors whose region requires opt-in and who have not
// chosen yet. The footer's "Cookie settings" item (hidden elsewhere) reopens
// it so the choice can be changed.
const ConsentBanner = () => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    const settings = document.getElementById("cookie-settings")
    const reopen = () => window.dispatchEvent(new Event(OPEN_EVENT))
    settings?.querySelector("button")?.addEventListener("click", reopen)

    void consentRequired().then((required) => {
      if (!alive || !required) return
      if (settings) settings.hidden = false
      if (!getStoredConsent()) setOpen(true)
    })
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => {
      alive = false
      settings?.querySelector("button")?.removeEventListener("click", reopen)
      window.removeEventListener(OPEN_EVENT, onOpen)
    }
  }, [])

  if (!open) return null

  const choose = (value: "granted" | "denied") => {
    setConsent(value)
    setOpen(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Analytics cookies"
      className="bg-background border-border fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border p-4 shadow-lg sm:right-4 sm:bottom-4 sm:left-auto sm:mx-0">
      <p className="text-sm font-medium">Analytics cookies</p>
      <p className="text-muted-foreground mt-1 text-sm">
        We would like to use Google Analytics and PostHog to understand how
        NTUMods is used. They set cookies and collect usage data. Nothing is
        loaded unless you accept, and you can change your mind in the footer.
        See our{" "}
        <a
          href="/privacy#analytics"
          className="text-primary underline underline-offset-2">
          Privacy Policy
        </a>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => choose("denied")}>
          Reject
        </Button>
        <Button size="sm" className="flex-1" onClick={() => choose("granted")}>
          Accept
        </Button>
      </div>
    </div>
  )
}

export default ConsentBanner
