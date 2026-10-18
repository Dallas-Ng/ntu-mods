import type { PostHogInterface } from "posthog-js"
import { beforeEach, describe, expect, it, vi } from "vitest"

// The module keeps the client and queue at module scope, so each test gets a
// fresh copy.
const load = async () => {
  vi.resetModules()
  return import("@/lib/analytics")
}

const fakeClient = () => {
  const capture = vi.fn()
  const ph = {
    capture,
    get_distinct_id: () => "ph-id"
  } as unknown as PostHogInterface
  return { ph, capture }
}

describe("analytics", () => {
  beforeEach(() => vi.useRealTimers())

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
    expect(a.getDistinctId()).toBe("ph-id")
  })

  it("drops queued and later events when PostHog is off", async () => {
    const a = await load()
    a.track("module_added")
    a.setAnalyticsClient(null)
    a.track("module_added")
    expect(a.getDistinctId()).toBeUndefined()
    await expect(a.whenAnalyticsReady(1000)).resolves.toBeNull()
  })

  it("whenAnalyticsReady waits for the client, or gives up", async () => {
    vi.useFakeTimers()
    const a = await load()
    const ready = a.whenAnalyticsReady(5000)
    const { ph } = fakeClient()
    a.setAnalyticsClient(ph)
    await expect(ready).resolves.toBe(ph)

    const b = await load()
    const timedOut = b.whenAnalyticsReady(5000)
    vi.advanceTimersByTime(5000)
    await expect(timedOut).resolves.toBeNull()
  })
})
