import { describe, expect, it } from "vitest"

import { trailingSlashRedirect } from "@/lib/trailing-slash"

describe("trailingSlashRedirect", () => {
  it("strips trailing slashes and keeps the query", () => {
    expect(trailingSlashRedirect("/mods/SC1003/", "?a=1")).toBe(
      "/mods/SC1003?a=1"
    )
    expect(trailingSlashRedirect("/faq//", "")).toBe("/faq")
  })

  it("leaves slashless paths and the root alone", () => {
    expect(trailingSlashRedirect("/faq", "")).toBeNull()
    expect(trailingSlashRedirect("/", "")).toBeNull()
  })

  it("never redirects the PostHog proxy", () => {
    expect(trailingSlashRedirect("/ingest/e/", "")).toBeNull()
    expect(trailingSlashRedirect("/ingest/i/v0/e/", "?ip=0")).toBeNull()
    expect(trailingSlashRedirect("/ingestion/", "")).toBe("/ingestion")
  })
})
