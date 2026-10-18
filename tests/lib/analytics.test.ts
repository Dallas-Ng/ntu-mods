import type { PostHogInterface } from "posthog-js"
import { afterEach, describe, expect, it, vi } from "vitest"

// The module keeps the client and queue at module scope, so each test gets a
// fresh copy.
const load = async () => {
  vi.resetModules()
  return import("@/lib/analytics")
}

const fakeClient = () => {
  const capture = vi.fn()
  const captureException = vi.fn()
  const ph = { capture, captureException } as unknown as PostHogInterface
  return { ph, capture, captureException }
}

describe("analytics", () => {
  afterEach(() => vi.useRealTimers())

  it("queues events until PostHog loads, then sends them in order", async () => {
    const a = await load()
    a.track("module_added", { module_code: "SC1003" })
    a.track("tool_opened")
    const { ph, capture } = fakeClient()
    a.setAnalyticsClient(ph)
    expect(capture.mock.calls).toEqual([
      ["module_added", { module_code: "SC1003" }],
      ["tool_opened", undefined]
    ])
    a.track("timetable_copied")
    expect(capture).toHaveBeenLastCalledWith("timetable_copied", undefined)
  })

  it("reportError tags the feature and queues until PostHog loads", async () => {
    const a = await load()
    const err = new Error("boom")
    a.reportError("modules_fetch", err, { year: "2026" })
    const { ph, captureException } = fakeClient()
    a.setAnalyticsClient(ph)
    expect(captureException).toHaveBeenCalledWith(err, {
      feature: "modules_fetch",
      year: "2026"
    })
    a.reportError("exams_fetch", err)
    expect(captureException).toHaveBeenLastCalledWith(err, {
      feature: "exams_fetch"
    })
  })

  it("reportError is dropped when PostHog is off", async () => {
    const a = await load()
    a.reportError("modules_fetch", new Error("boom"))
    a.setAnalyticsClient(null)
    const { ph, captureException } = fakeClient()
    a.setAnalyticsClient(ph)
    expect(captureException).not.toHaveBeenCalled()
  })

  it("drops queued and later events when PostHog is off", async () => {
    const a = await load()
    a.track("module_added")
    a.setAnalyticsClient(null)
    a.track("module_added")
    await expect(a.whenAnalyticsReady(1000)).resolves.toBeNull()
    // Nothing was kept: a client that turns up afterwards gets no backlog.
    const { ph, capture } = fakeClient()
    a.setAnalyticsClient(ph)
    expect(capture).not.toHaveBeenCalled()
  })

  it("whenAnalyticsReady waits for the client and clears its timer", async () => {
    vi.useFakeTimers()
    const a = await load()
    const ready = a.whenAnalyticsReady(5000)
    expect(vi.getTimerCount()).toBe(1)
    const { ph } = fakeClient()
    a.setAnalyticsClient(ph)
    await expect(ready).resolves.toBe(ph)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("whenAnalyticsReady gives up after the timeout", async () => {
    vi.useFakeTimers()
    const a = await load()
    const timedOut = a.whenAnalyticsReady(5000)
    vi.advanceTimersByTime(5000)
    await expect(timedOut).resolves.toBeNull()
  })
})
