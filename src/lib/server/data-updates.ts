/**
 * When the course data changed, for the navbar's "Updated 3 days ago" (through
 * status.json) and the developer data freshness page. Build time only: it reads
 * git and the changelog.
 *
 * The scraper does not stamp its output, so two sources are combined:
 *
 * - The git history of the data files, exact but missing on CI, which builds from
 *   a shallow clone where every file carries the checkout's date (the same
 *   reason build-sitemap.mts skips git dates there);
 * - Changelog releases with a "Data" item, which a data refresh should add.
 */

import { execFileSync } from "node:child_process"

import {
  CHANGELOG,
  getReleaseSlug,
  type ChangelogItem
} from "@/config/changelog-data"

export interface DataUpdate {
  /** YYYY-MM-DD */
  date: string
  /** As written in the changelog, e.g. "23 Nov 2026". */
  label: string
  title: string
  /** Anchor of the release on /changelog. */
  slug: string
  items: ChangelogItem[]
}

const DATA_DIRS = [
  "src/data/api/metadata",
  "src/data/api/indexes",
  "src/data/api/exams"
]

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

/** Changelog releases that changed the data, newest first. */
export function getDataUpdates(): DataUpdate[] {
  return CHANGELOG.flatMap((release) => {
    const items = release.items.filter((i) => i.category === "Data")
    const date = new Date(`${release.date} UTC`)
    if (items.length === 0 || Number.isNaN(date.getTime())) return []
    return [
      {
        date: isoDate(date),
        label: release.date,
        title: release.title,
        slug: getReleaseSlug(release),
        items
      }
    ]
  })
}

/** The last commit that touched the data files, or undefined without history. */
function gitDataDate(): string | undefined {
  try {
    const shallow =
      execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
        encoding: "utf8"
      }).trim() !== "false"
    if (shallow) return undefined
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", ...DATA_DIRS],
      { encoding: "utf8" }
    ).trim()
    return out ? isoDate(new Date(out)) : undefined
  } catch {
    // No git (a source tarball, or a runtime without child processes).
    return undefined
  }
}

/** When the data last changed, YYYY-MM-DD, or undefined if neither source knows. */
export function getLastDataUpdate(): string | undefined {
  const dates = [gitDataDate(), getDataUpdates()[0]?.date].filter(
    (d): d is string => Boolean(d)
  )
  return dates.sort().at(-1)
}
