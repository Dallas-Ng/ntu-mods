import type { ArticleHeading } from "@/lib/server/articles"

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'"
}

/** Decodes HTML entities in one pass, so "&amp;lt;" stays "&lt;". */
const decode = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] !== "#") return NAMED[entity.toLowerCase()] ?? match
    const hex = entity[1].toLowerCase() === "x"
    return String.fromCodePoint(
      parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10)
    )
  })

/** Strips tags until none remain, so "<<b>script>" cannot reassemble one. */
const stripTags = (html: string) => {
  let prev: string
  do {
    prev = html
    html = html.replace(/<[^>]+>/g, "")
  } while (html !== prev)
  return html
}

/**
 * The h2s with an id in rendered HTML, for an "On this page" nav. Drops the
 * "#" HeadingAnchor link and any other tags inside the heading. Astro writes
 * an apostrophe as &#39; and React as &#x27;; both come back as "'".
 */
export const htmlHeadings = (html: string): ArticleHeading[] =>
  [...html.matchAll(/<h2\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)].map(
    ([, id, inner]) => ({
      id,
      depth: 2,
      text: decode(
        stripTags(inner.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, "")).trim()
      )
    })
  )
