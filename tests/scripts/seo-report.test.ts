import { describe, expect, it } from "vitest"

import {
  buildArticleReports,
  findGaps,
  renderMarkdown,
  slugOf,
  type GscRow
} from "../../scripts/seo-report/analyse"

const row = (
  keys: string[],
  clicks: number,
  impressions: number,
  position: number
): GscRow => ({
  keys,
  clicks,
  impressions,
  ctr: clicks / impressions,
  position
})

const URL = "https://ntumods.com/articles/ntu-stars-guide"

describe("slugOf", () => {
  it("matches article URLs only", () => {
    expect(slugOf(URL)).toBe("ntu-stars-guide")
    expect(slugOf(`${URL}/`)).toBe("ntu-stars-guide")
    expect(slugOf("https://ntumods.com/articles")).toBeNull()
    expect(slugOf("https://ntumods.com/mods/SC1003")).toBeNull()
  })
})

describe("buildArticleReports", () => {
  const base = {
    articles: [
      { slug: "ntu-stars-guide", title: "STARS", updated: "2026-10-01" }
    ],
    prevPages: [] as GscRow[],
    pageQueries: [] as GscRow[],
    posthog: [],
    today: new Date("2026-10-18")
  }

  it("merges duplicate URLs and flags a CTR gap", () => {
    const [r] = buildArticleReports({
      ...base,
      pages: [row([URL], 5, 900, 3), row([`${URL}/`], 1, 100, 3)]
    })
    expect(r.clicks).toBe(6)
    expect(r.impressions).toBe(1000)
    expect(r.actions.some((a) => a.startsWith("Rewrite title"))).toBe(true)
  })

  it("flags striking-distance queries, declines and stale pages", () => {
    const [r] = buildArticleReports({
      ...base,
      articles: [{ ...base.articles[0], updated: "2026-01-01" }],
      pages: [row([URL], 10, 100, 12)],
      prevPages: [row([URL], 50, 400, 9)],
      pageQueries: [row([URL, "ntu stars dates"], 1, 80, 11)]
    })
    expect(r.strikingQueries).toHaveLength(1)
    expect(r.actions.join("\n")).toMatch(/Close to page 1/)
    expect(r.actions.join("\n")).toMatch(/Clicks fell 80%/)
    expect(r.actions.join("\n")).toMatch(/Last updated 2026-01-01/)
  })

  it("tells a jumping-off page apart from one that loses readers", () => {
    const stats = {
      path: "/articles/ntu-stars-guide",
      pageviews: 100,
      visitors: 90,
      googlePageviews: 60,
      sessions: 50,
      medianRead: 0.1,
      medianSeconds: 9
    }
    const run = (acted: number) =>
      buildArticleReports({
        ...base,
        pages: [],
        posthog: [{ ...stats, sessionsWithAction: acted }]
      })[0].actions.join("\n")
    expect(run(25)).toMatch(/go on to use the planner/)
    expect(run(1)).toMatch(/Put the answer first/)
  })
})

describe("findGaps", () => {
  it("keeps high-volume queries whose best page ranks past page 2", () => {
    const gaps = findGaps([
      row([URL, "ntu hall ranking"], 0, 150, 35),
      row(["https://ntumods.com/", "ntu hall ranking"], 0, 50, 28),
      row([URL, "ntu stars"], 30, 500, 4),
      row([URL, "rare query"], 0, 10, 40)
    ])
    expect(gaps).toEqual([
      {
        query: "ntu hall ranking",
        impressions: 200,
        position: 28,
        page: "https://ntumods.com/"
      }
    ])
  })
})

describe("renderMarkdown", () => {
  it("renders without PostHog or Search Console data", () => {
    const reports = buildArticleReports({
      articles: [{ slug: "a", title: "A", updated: "" }],
      pages: [],
      prevPages: [],
      pageQueries: [],
      posthog: [],
      today: new Date()
    })
    const md = renderMarkdown({ from: "x", to: "y", reports, gaps: [] })
    expect(md).toContain("| a | 0 (0) | 0 | 0% | – |")
  })
})
