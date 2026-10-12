/**
 * Cache-Control for on-demand (D1-rendered) module pages. A cold render costs
 * 1-6s, so keep the edge copy for a week and serve it stale while a fresh one
 * is fetched. Module data changes about once a semester; purge the Cloudflare
 * cache after a data refresh (or run scripts/warm-cache.mjs) so it shows.
 */
export const ON_DEMAND_CACHE_CONTROL =
  "public, max-age=3600, s-maxage=604800, stale-while-revalidate=2592000"
