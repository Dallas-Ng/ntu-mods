"use client"

import { useEffect, useState } from "react"

import { getStoredConsent, onConsentChange, setConsent } from "@/lib/consent"
import { Button } from "@/components/ui/button"
import { TextLink } from "@/components/ui/text-link"

const ConsentBanner = () => {
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const settings = document.querySelector<HTMLButtonElement>(
      "#cookie-settings button"
    )
    const reopen = () => setSettingsOpen(true)
    const sync = () => setOpen(getStoredConsent() === null)
    sync()
    const unsubscribe = onConsentChange(sync)
    settings?.addEventListener("click", reopen)
    if (settings) settings.hidden = false
    return () => {
      settings?.removeEventListener("click", reopen)
      if (settings) settings.hidden = true
      unsubscribe()
    }
  }, [])

  if (!open && !settingsOpen) return null

  const choose = (value: "granted" | "denied") => {
    setConsent(value)
    setSettingsOpen(false)
  }

  return (
    <div
      role="region"
      aria-label="Analytics cookies"
      className="bg-background border-border fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border p-4 shadow-lg sm:right-4 sm:bottom-4 sm:left-auto sm:mx-0">
      <p className="text-sm font-medium">Analytics cookies</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Allow Google Analytics and PostHog to use cookies and measure how you
        use NTUMods, including errors and article views. Your browser saves your
        choice. You can change it in Cookie settings. See our{" "}
        <TextLink href="/privacy#consent">Privacy Policy</TextLink>.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => choose("denied")}>
          Reject analytics
        </Button>
        <Button size="sm" className="flex-1" onClick={() => choose("granted")}>
          Accept analytics
        </Button>
      </div>
    </div>
  )
}

export default ConsentBanner
