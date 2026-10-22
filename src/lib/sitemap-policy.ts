// Which module URLs the sitemap advertises. Pages outside these windows still
// resolve and stay indexable; they are just not pushed at crawlers. Shared by
// scripts/build-sitemap.mts and the e2e suite so they cannot drift apart.

/** First calendar year of the academic year containing `now` (AY starts in August). */
export const currentAYStart = (now = new Date()) =>
  now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1

/** Versioned /mods/CODE/Y/S pages: this and the previous AY. */
export const versionedYearCutoff = (now = new Date()) => currentAYStart(now) - 1

/** /mods/CODE pages: modules last offered in the last three AYs. Older, unrevised pages are thin and stale. */
export const moduleYearCutoff = (now = new Date()) => currentAYStart(now) - 2

/**
 * What makes an older snapshot "the same page" as the module's latest offering:
 * module record plus which indexes exist. Slot times, venues and exams change
 * every semester but leave the page a near-duplicate, so Google folds them into
 * /mods/CODE anyway. Shared by the page's canonical tag and the sitemap so the
 * two cannot disagree.
 */
export const snapshotFingerprint = (
  moduleData: unknown,
  indexes: Record<string, unknown>
) => JSON.stringify([moduleData, Object.keys(indexes).sort()])
