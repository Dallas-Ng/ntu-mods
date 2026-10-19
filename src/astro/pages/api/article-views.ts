import type { APIRoute } from "astro"
import { env, waitUntil } from "cloudflare:workers"

import { reportServerError } from "@/lib/posthog-server"
import { isCrossSite, rateLimit } from "@/lib/server/guard"
import { getAllArticles } from "@/astro/lib/articles"

export const prerender = false

const SLUG = /^[a-z0-9-]{1,100}$/
const VISITOR = /^[A-Za-z0-9_-]{8,64}$/

function json(body: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  })
}

// All counts at once, for the articles list. Briefly cached: a stale list
// count is harmless and this scans the whole table.
export const GET: APIRoute = async ({ url }) => {
  // One cache key: a query string would otherwise bypass the edge cache and
  // rerun the table scan.
  if (url.search) {
    return new Response(null, {
      status: 308,
      headers: {
        Location: url.pathname,
        "Cache-Control": "public, max-age=86400"
      }
    })
  }
  const { DB } = env
  if (!DB) return json({ error: "DB not bound" }, 500)

  // View counts are cosmetic: if the query fails, answer with no counts
  // rather than a 500 in the browser console.
  try {
    const { results } = await DB.prepare(
      `SELECT slug, SUM(n) AS n FROM (
         SELECT slug, COUNT(*) AS n FROM article_views GROUP BY slug
         UNION ALL
         SELECT slug, n FROM article_view_baselines
       ) GROUP BY slug`
    ).all<{ slug: string; n: number }>()
    const views = Object.fromEntries((results ?? []).map((r) => [r.slug, r.n]))
    return json({ views }, 200, {
      "Cache-Control": "public, max-age=300, s-maxage=300"
    })
  } catch (e) {
    reportServerError(
      env.PUBLIC_POSTHOG_TOKEN,
      waitUntil,
      "article_views_get",
      e
    )
    return json({ views: {} })
  }
}

// Records this visitor (idempotent) and returns the unique-view count,
// including the baseline from before the counter existed.
export const POST: APIRoute = async ({ request }) => {
  if (isCrossSite(request)) return json({ error: "Forbidden" }, 403)
  const limited = await rateLimit("VIEWS_LIMITER", request)
  if (limited) return limited

  const { DB } = env
  if (!DB) return json({ error: "DB not bound" }, 500)

  const { slug, visitorId } = (await request.json().catch(() => ({}))) as {
    slug?: unknown
    visitorId?: unknown
  }
  if (
    typeof slug !== "string" ||
    !SLUG.test(slug) ||
    typeof visitorId !== "string" ||
    !VISITOR.test(visitorId)
  ) {
    return json({ error: "Invalid slug or visitorId" }, 400)
  }

  // Only real articles get rows; otherwise anyone can grow the table with
  // made-up slugs.
  const articles = await getAllArticles()
  if (!articles.some((article) => article.slug === slug)) {
    return json({ error: "Unknown article" }, 404)
  }

  try {
    await DB.prepare(
      "INSERT OR IGNORE INTO article_views (slug, visitor_id) VALUES (?, ?)"
    )
      .bind(slug, visitorId)
      .all()
    const row = await DB.prepare(
      `SELECT (SELECT COUNT(*) FROM article_views WHERE slug = ?1)
            + COALESCE((SELECT n FROM article_view_baselines WHERE slug = ?1), 0)
              AS n`
    )
      .bind(slug)
      .first<{ n: number }>()

    return json({ views: row?.n ?? 0 })
  } catch (e) {
    reportServerError(
      env.PUBLIC_POSTHOG_TOKEN,
      waitUntil,
      "article_views_post",
      e,
      { slug }
    )
    return json({ views: 0 })
  }
}
