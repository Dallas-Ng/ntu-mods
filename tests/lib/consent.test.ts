// @vitest-environment jsdom

import { afterEach, expect, it, vi } from "vitest"

import {
  getStoredConsent,
  hasAnalyticsConsent,
  onConsentChange,
  setConsent,
  whenConsented
} from "@/lib/consent"

afterEach(() => localStorage.clear())

it("waits for explicit opt-in and runs pending work once", () => {
  const start = vi.fn()
  whenConsented(start)
  expect(getStoredConsent()).toBeNull()
  expect(hasAnalyticsConsent()).toBe(false)
  setConsent("denied")
  expect(start).not.toHaveBeenCalled()
  setConsent("granted")
  expect(start).toHaveBeenCalledOnce()
  setConsent("denied")
  expect(hasAnalyticsConsent()).toBe(false)
  setConsent("granted")
  expect(start).toHaveBeenCalledOnce()
})

it("updates active tabs when another tab withdraws consent", () => {
  setConsent("granted")
  const update = vi.fn()
  const unsubscribe = onConsentChange(update)
  localStorage.setItem("ntumods-consent", "denied")
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "ntumods-consent",
      storageArea: localStorage
    })
  )
  unsubscribe()
  expect(update).toHaveBeenCalledWith(false)
})
