// Article slugs ranked by human views, most read first. Source: PostHog
// `article_viewed` events (bots excluded), last 90 days, queried 2026-10-17.
// The landing page leads with the first one it finds; refresh the order by
// re-running that query when the ranking drifts.
export const POPULAR_ARTICLE_SLUGS = [
  "complete-ntu-bde-list",
  "ntu-academic-calendar-ay2026",
  "most-popular-bdes-at-ntu",
  "ntu-student-portal-links",
  "what-is-a-bde-at-ntu",
  "easy-bde-at-ntu",
  "how-to-bid-for-bde-at-ntu",
  "ntu-stars-guide"
] as const
