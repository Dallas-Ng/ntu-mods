// Warms the HTTP cache for an internal link on hover/touch so the navigation
// is a cache hit. Plain fetch() instead of Astro's built-in prefetch, which
// uses <link rel="prefetch">: Chrome tags those with `Sec-Purpose: prefetch`
// and Cloudflare answers every one with 503 ("prefetch refused: disabled for
// worker requests"). An untagged fetch is served from the edge cache like any
// other request and honours the long Cache-Control on prerendered pages.
const seen = new Set<string>()
const moduleSnapshotPath = /^\/mods\/[^/]+\/\d{4}\/[12ST]\/?$/i
let timer: number | undefined

const conn = (navigator as { connection?: { saveData?: boolean } }).connection

function prefetch(target: EventTarget | null) {
  if (conn?.saveData || !navigator.onLine) return
  const a = (target as Element | null)?.closest?.("a")
  if (!a || a.target === "_blank" || a.hasAttribute("download")) return
  if (a.dataset.noPrefetch !== undefined) return
  const url = new URL(a.href, location.href)
  if (url.origin !== location.origin) return
  // Semester snapshots can trigger a Worker render and D1 reads on a miss.
  // Fetch them when the visitor follows the link.
  if (moduleSnapshotPath.test(url.pathname)) return
  if (url.pathname === location.pathname && url.search === location.search)
    return
  if (seen.has(url.pathname + url.search)) return
  seen.add(url.pathname + url.search)
  fetch(url.pathname + url.search, { priority: "low" } as RequestInit).catch(
    () => seen.delete(url.pathname + url.search)
  )
}

document.addEventListener(
  "mouseover",
  (e) => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => prefetch(e.target), 80)
  },
  { passive: true }
)
document.addEventListener("mouseout", () => window.clearTimeout(timer), {
  passive: true
})
document.addEventListener("touchstart", (e) => prefetch(e.target), {
  passive: true
})
