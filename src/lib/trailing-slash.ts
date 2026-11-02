/**
 * Where a request with trailing slashes should go, or null when it needs no
 * redirect. Replaces Astro's `trailingSlash: "never"` redirect, which also
 * bounced PostHog's POSTs to /ingest/e/ (a second Worker run per event).
 */
const EXEMPT = /^\/ingest(\/|$)/

export function trailingSlashRedirect(
  pathname: string,
  search: string
): string | null {
  if (pathname.length < 2 || !pathname.endsWith("/") || EXEMPT.test(pathname))
    return null
  const stripped = pathname.replace(/\/+$/, "")
  return (stripped || "/") + search
}
