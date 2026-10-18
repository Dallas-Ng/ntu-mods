// Pure part of the SEO report: joins Search Console rows with PostHog article
// stats and turns them into a to-do list. No I/O here, so it can be tested
// without credentials (tests/scripts/seo-report.test.ts).

export interface GscRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface ArticleMeta {
  slug: string
  title: string
  updated: string
}

export interface PostHogArticleStats {
  path: string
  pageviews: number
  visitors: number
  googlePageviews: number
  sessions: number
  sessionsWithAction: number
  medianRead: number | null
  medianSeconds: number | null
}

export interface ArticleReport {
  slug: string
  title: string
  updated: string
  clicks: number
  prevClicks: number
  impressions: number
  ctr: number
  position: number | null
  topQueries: GscRow[]
  strikingQueries: GscRow[]
  posthog: PostHogArticleStats | null
  actions: string[]
}

export interface GapQuery {
  query: string
  impressions: number
  position: number
  page: string
}

// Rough organic CTR by position, used only to flag titles that under-perform
// for where they rank. Real curves vary by query; treat the flag as a prompt
// to look, not a measurement.
const EXPECTED_CTR = [
  0.28, 0.15, 0.1, 0.07, 0.05, 0.04, 0.03, 0.025, 0.02, 0.018
]

export const THRESHOLDS = {
  ctrGapMinImpressions: 200,
  ctrGapRatio: 0.6,
  strikingMinPosition: 8,
  strikingMaxPosition: 20,
  strikingMinImpressions: 50,
  declineRatio: 0.7,
  declineMinPrevClicks: 20,
  lowReadMinSessions: 30,
  lowRead: 0.35,
  staleDays: 180,
  gapMinImpressions: 100,
  gapMinPosition: 20
}

export function expectedCtr(position: number): number {
  const i = Math.max(0, Math.round(position) - 1)
  return EXPECTED_CTR[i] ?? 0.01
}

export function pathOf(url: string): string {
  try {
    return new URL(url).pathname.replace(/\/+$/, "") || "/"
  } catch {
    return url
  }
}

export function slugOf(url: string): string | null {
  const m = /^\/articles\/([a-z0-9-]+)$/.exec(pathOf(url))
  return m ? m[1] : null
}

function daysBetween(a: string, b: Date): number {
  return Math.floor((b.getTime() - new Date(a).getTime()) / 86_400_000)
}

const pct = (n: number) => `${Math.round(n * 100)}%`

export function buildArticleReports(input: {
  articles: ArticleMeta[]
  pages: GscRow[] // dimensions: [page]
  prevPages: GscRow[] // dimensions: [page], previous period
  pageQueries: GscRow[] // dimensions: [page, query]
  posthog: PostHogArticleStats[]
  today: Date
}): ArticleReport[] {
  const t = THRESHOLDS
  const bySlug = <T>(rows: T[], url: (r: T) => string) => {
    const m = new Map<string, T[]>()
    for (const r of rows) {
      const s = slugOf(url(r))
      if (!s) continue
      m.set(s, [...(m.get(s) ?? []), r])
    }
    return m
  }
  const pages = bySlug(input.pages, (r) => r.keys[0])
  const prev = bySlug(input.prevPages, (r) => r.keys[0])
  const queries = bySlug(input.pageQueries, (r) => r.keys[0])
  const ph = new Map(
    input.posthog.flatMap((s) => {
      const slug = slugOf(`https://x${s.path}`)
      return slug ? [[slug, s] as const] : []
    })
  )

  return input.articles
    .map((a) => {
      // A page can show up under more than one URL (trailing slash, query
      // string): sum clicks and impressions, weight position by impressions.
      const rows = pages.get(a.slug) ?? []
      const clicks = rows.reduce((n, r) => n + r.clicks, 0)
      const impressions = rows.reduce((n, r) => n + r.impressions, 0)
      const position = impressions
        ? rows.reduce((n, r) => n + r.position * r.impressions, 0) / impressions
        : null
      const ctr = impressions ? clicks / impressions : 0
      const prevClicks = (prev.get(a.slug) ?? []).reduce(
        (n, r) => n + r.clicks,
        0
      )
      const qs = (queries.get(a.slug) ?? []).sort(
        (x, y) => y.impressions - x.impressions
      )
      const striking = qs.filter(
        (q) =>
          q.position >= t.strikingMinPosition &&
          q.position <= t.strikingMaxPosition &&
          q.impressions >= t.strikingMinImpressions
      )
      const stats = ph.get(a.slug) ?? null

      const actions: string[] = []
      if (
        position !== null &&
        position <= 10 &&
        impressions >= t.ctrGapMinImpressions &&
        ctr < expectedCtr(position) * t.ctrGapRatio
      ) {
        actions.push(
          `Rewrite title/description: CTR ${pct(ctr)} at position ${position.toFixed(1)}, where ~${pct(expectedCtr(position))} is typical.`
        )
      }
      if (striking.length) {
        actions.push(
          `Close to page 1 for ${striking.length} quer${striking.length === 1 ? "y" : "ies"} (e.g. "${striking[0].keys[1]}", position ${striking[0].position.toFixed(1)}): cover them with a section, FAQ entry or internal links.`
        )
      }
      if (
        prevClicks >= t.declineMinPrevClicks &&
        clicks < prevClicks * t.declineRatio
      ) {
        actions.push(
          `Clicks fell ${pct(1 - clicks / prevClicks)} vs the previous period (${prevClicks} → ${clicks}): refresh it.`
        )
      }
      if (
        stats &&
        stats.medianRead !== null &&
        stats.sessions >= t.lowReadMinSessions &&
        stats.medianRead < t.lowRead
      ) {
        const actionRate = stats.sessions
          ? stats.sessionsWithAction / stats.sessions
          : 0
        actions.push(
          actionRate >= 0.2
            ? `Readers stop at ${pct(stats.medianRead)} but ${pct(actionRate)} go on to use the planner: fine if it's a jumping-off page, otherwise move the key answer up.`
            : `Readers stop at ${pct(stats.medianRead)} of the page: the opening may not match what searchers want. Put the answer first.`
        )
      }
      if (a.updated && daysBetween(a.updated, input.today) > t.staleDays) {
        actions.push(
          `Last updated ${a.updated}: check dates, semesters and links are still current.`
        )
      }

      return {
        slug: a.slug,
        title: a.title,
        updated: a.updated,
        clicks,
        prevClicks,
        impressions,
        ctr,
        position,
        topQueries: qs.slice(0, 5),
        strikingQueries: striking.slice(0, 5),
        posthog: stats,
        actions
      }
    })
    .sort((x, y) => y.impressions - x.impressions)
}

// Queries the site is seen for but ranks past page 2 on, even with its best
// page: candidates for a new article or a new section in an existing one.
export function findGaps(pageQueries: GscRow[]): GapQuery[] {
  const best = new Map<string, GapQuery>()
  const totals = new Map<string, number>()
  for (const r of pageQueries) {
    const [page, query] = r.keys
    totals.set(query, (totals.get(query) ?? 0) + r.impressions)
    const cur = best.get(query)
    if (!cur || r.position < cur.position) {
      best.set(query, { query, impressions: 0, position: r.position, page })
    }
  }
  return [...best.values()]
    .map((g) => ({ ...g, impressions: totals.get(g.query) ?? 0 }))
    .filter(
      (g) =>
        g.impressions >= THRESHOLDS.gapMinImpressions &&
        g.position > THRESHOLDS.gapMinPosition
    )
    .sort((x, y) => y.impressions - x.impressions)
    .slice(0, 25)
}

export function renderMarkdown(input: {
  from: string
  to: string
  reports: ArticleReport[]
  gaps: GapQuery[]
}): string {
  const out: string[] = []
  const n = (v: number) => v.toLocaleString("en-SG")
  out.push(`# SEO report: ${input.from} to ${input.to}`, "")
  out.push(
    'Search data from Google Search Console; reading and action data from PostHog (production, internal users excluded). "Action" = the session went on to add a module, open a tool or click Make my timetable.',
    ""
  )

  const todo = input.reports.filter((r) => r.actions.length)
  out.push(`## To do (${todo.length} articles)`, "")
  for (const r of todo) {
    out.push(`### [${r.title}](https://ntumods.com/articles/${r.slug})`)
    for (const a of r.actions) out.push(`- ${a}`)
    out.push("")
  }

  out.push("## All articles", "")
  out.push(
    "| Article | Clicks (prev) | Impr. | CTR | Pos. | Google views | Median read | Median time | Action rate |",
    "|---|---|---|---|---|---|---|---|---|"
  )
  for (const r of input.reports) {
    const s = r.posthog
    out.push(
      `| ${r.slug} | ${n(r.clicks)} (${n(r.prevClicks)}) | ${n(r.impressions)} | ${pct(r.ctr)} | ${r.position?.toFixed(1) ?? "–"} | ${s ? n(s.googlePageviews) : "–"} | ${s?.medianRead != null ? pct(s.medianRead) : "–"} | ${s?.medianSeconds != null ? `${Math.round(s.medianSeconds)}s` : "–"} | ${s?.sessions ? pct(s.sessionsWithAction / s.sessions) : "–"} |`
    )
  }
  out.push("")

  out.push("## Top queries per article", "")
  for (const r of input.reports.filter((r) => r.topQueries.length)) {
    out.push(
      `**${r.slug}**: ${r.topQueries.map((q) => `"${q.keys[1]}" (${n(q.impressions)} impr., pos ${q.position.toFixed(1)})`).join(", ")}`,
      ""
    )
  }

  out.push("## Content gaps", "")
  out.push(
    "Queries with real search volume where even the site's best page ranks past page 2.",
    ""
  )
  out.push("| Query | Impr. | Best pos. | Best page |", "|---|---|---|---|")
  for (const g of input.gaps) {
    out.push(
      `| ${g.query} | ${n(g.impressions)} | ${g.position.toFixed(1)} | ${pathOf(g.page)} |`
    )
  }
  out.push("")
  return out.join("\n")
}
