// SEO report: what to update and what to write next, from Google Search
// Console (queries, impressions, ranking) joined with PostHog (how far people
// read, whether they go on to use the planner). Replaces the GA <-> Search
// Console link we lost when GA was removed.
//
//   yarn seo:report [--days 28]
//
// Needs, in the environment or a .env file you source first:
//   GSC_CREDENTIALS          path to a Google service-account JSON key. Add the
//                            service account's email as a (restricted) user on
//                            the Search Console property.
//     or GSC_ACCESS_TOKEN    an OAuth token with the webmasters.readonly scope
//   GSC_SITE                 default "sc-domain:ntumods.com"; use
//                            "https://ntumods.com/" for a URL-prefix property
//   POSTHOG_PERSONAL_API_KEY a personal API key with the query:read scope
//   POSTHOG_PROJECT_ID       default 442406
//   POSTHOG_HOST             default https://us.posthog.com
//
// Writes reports/seo/<end-date>.md (gitignored).
import { createSign } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  buildArticleReports,
  findGaps,
  renderMarkdown,
  type ArticleMeta,
  type GscRow,
  type PostHogArticleStats
} from "./analyse.ts"

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..")
const GSC_SITE = process.env.GSC_SITE || "sc-domain:ntumods.com"
const POSTHOG_HOST = process.env.POSTHOG_HOST || "https://us.posthog.com"
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "442406"
// The "Internal / Test users" cohort the project's test-account filter uses.
const INTERNAL_COHORT_ID = 330617

const daysArg = process.argv.indexOf("--days")
const DAYS = daysArg > -1 ? Number(process.argv[daysArg + 1]) : 28
if (!Number.isInteger(DAYS) || DAYS < 1)
  throw new Error("--days must be a positive integer")

function fail(msg: string): never {
  console.error(`[seo-report] ${msg}`)
  process.exit(1)
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)

// Search Console data lags by 2–3 days; ending 3 days ago avoids a
// half-filled last day that would read as a drop.
const today = new Date()
const end = addDays(today, -3)
const start = addDays(end, -(DAYS - 1))
const prevEnd = addDays(start, -1)
const prevStart = addDays(prevEnd, -(DAYS - 1))

async function gscToken(): Promise<string> {
  if (process.env.GSC_ACCESS_TOKEN) return process.env.GSC_ACCESS_TOKEN
  const file = process.env.GSC_CREDENTIALS
  if (!file)
    fail("set GSC_CREDENTIALS (service-account key) or GSC_ACCESS_TOKEN")
  const key = JSON.parse(await fs.readFile(file, "utf8")) as {
    client_email: string
    private_key: string
  }
  const now = Math.floor(Date.now() / 1000)
  const b64 = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString("base64url")
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  })}`
  const sig = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(key.private_key, "base64url")
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${sig}`
    })
  })
  if (!res.ok)
    fail(`Google token request failed: ${res.status} ${await res.text()}`)
  return ((await res.json()) as { access_token: string }).access_token
}

async function gsc(
  token: string,
  dimensions: string[],
  from: Date,
  to: Date
): Promise<GscRow[]> {
  const rows: GscRow[] = []
  // The API returns at most 25k rows per call; page until a short page.
  for (let startRow = 0; ; startRow += 25_000) {
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          startDate: isoDate(from),
          endDate: isoDate(to),
          dimensions,
          rowLimit: 25_000,
          startRow
        })
      }
    )
    if (!res.ok)
      fail(`Search Console query failed: ${res.status} ${await res.text()}`)
    const page = ((await res.json()) as { rows?: GscRow[] }).rows ?? []
    rows.push(...page)
    if (page.length < 25_000) return rows
  }
}

async function hogql<T extends unknown[]>(query: string): Promise<T[]> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY
  if (!key)
    fail("set POSTHOG_PERSONAL_API_KEY (personal API key with query:read)")
  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } })
    }
  )
  if (!res.ok) fail(`PostHog query failed: ${res.status} ${await res.text()}`)
  return ((await res.json()) as { results: T[] }).results
}

async function posthogStats(): Promise<PostHogArticleStats[]> {
  // Same window as Search Console. Previews send to the same project, so the
  // host filter keeps only production.
  const window = `timestamp >= toDateTime('${isoDate(start)} 00:00:00') AND timestamp < toDateTime('${isoDate(addDays(end, 1))} 00:00:00')`
  const prod = `properties.$host = 'ntumods.com' AND NOT (person_id IN COHORT ${INTERNAL_COHORT_ID})`
  const [views, reads] = await Promise.all([
    hogql<[string, number, number, number, number, number]>(`
      WITH acted AS (
        SELECT DISTINCT $session_id AS sid
        FROM events
        WHERE event IN ('module_added', 'tool_opened', 'make_my_timetable_clicked')
          AND ${window} AND ${prod}
      )
      SELECT
        properties.$pathname AS path,
        count() AS pageviews,
        uniq(person_id) AS visitors,
        countIf(properties.$referring_domain ILIKE '%google.%') AS google_pageviews,
        uniq($session_id) AS sessions,
        uniqIf($session_id, $session_id IN (SELECT sid FROM acted)) AS sessions_with_action
      FROM events
      WHERE event = '$pageview' AND ${window} AND ${prod}
        AND properties.$pathname LIKE '/articles/%'
      GROUP BY path
      LIMIT 500`),
    // Durations are capped at 30 min: a tab left open would otherwise count as
    // hours of reading.
    hogql<[string, number | null, number | null]>(`
      SELECT
        properties.$prev_pageview_pathname AS path,
        quantile(0.5)(toFloat(properties.$prev_pageview_max_content_percentage)) AS median_read,
        quantile(0.5)(least(toFloat(properties.$prev_pageview_duration), 1800)) AS median_seconds
      FROM events
      WHERE event = '$pageleave' AND ${window} AND ${prod}
        AND properties.$prev_pageview_pathname LIKE '/articles/%'
      GROUP BY path
      LIMIT 500`)
  ])
  const readBy = new Map(reads.map(([p, r, s]) => [p, { r, s }]))
  return views.map(([p, pageviews, visitors, google, sessions, acted]) => ({
    path: p,
    pageviews,
    visitors,
    googlePageviews: google,
    sessions,
    sessionsWithAction: acted,
    medianRead: readBy.get(p)?.r ?? null,
    medianSeconds: readBy.get(p)?.s ?? null
  }))
}

async function articles(): Promise<ArticleMeta[]> {
  const dir = path.join(ROOT, "content", "articles")
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"))
  return Promise.all(
    files.map(async (f) => {
      const src = await fs.readFile(path.join(dir, f), "utf8")
      const front = /^---\n([\s\S]*?)\n---/.exec(src)?.[1] ?? ""
      const field = (k: string) =>
        new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, "m").exec(front)?.[1] ?? ""
      return {
        slug: f.replace(/\.md$/, ""),
        title: field("title"),
        updated: field("updated") || field("date")
      }
    })
  )
}

const token = await gscToken()
const [meta, pages, prevPages, pageQueries, posthog] = await Promise.all([
  articles(),
  gsc(token, ["page"], start, end),
  gsc(token, ["page"], prevStart, prevEnd),
  gsc(token, ["page", "query"], start, end),
  posthogStats()
])

const reports = buildArticleReports({
  articles: meta,
  pages,
  prevPages,
  pageQueries,
  posthog,
  today
})
const md = renderMarkdown({
  from: isoDate(start),
  to: isoDate(end),
  reports,
  gaps: findGaps(pageQueries)
})

const outDir = path.join(ROOT, "reports", "seo")
await fs.mkdir(outDir, { recursive: true })
const out = path.join(outDir, `${isoDate(end)}.md`)
await fs.writeFile(out, md)
console.log(
  `[seo-report] ${reports.filter((r) => r.actions.length).length} articles with actions → ${path.relative(ROOT, out)}`
)
