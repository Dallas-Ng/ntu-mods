/**
 * SQL for the D1 binding, used by exactly one caller:
 * edge/get-module-snapshot.ts, the on-demand historic-snapshot route.
 *
 * Every other read in the app — prerendered pages, client JSON artifacts,
 * the sitemap — goes through db/json-source.ts instead, reading
 * src/data/api directly. D1 only backs this one route; see its file for why
 * it needs a live query rather than a build-time read (it serves pages for
 * semesters that aren't prerendered).
 *
 * These are plain strings with `?` placeholders, D1's binding API.
 */

/**
 * The latest semester means *the newest semester that actually has data*,
 * ordered by sort_key.
 *
 * Deliberately NOT `semesters.json[0]`, which is what src/lib/semesters.ts uses
 * today. That file is the portal's catalogue, scraped independently of whether
 * any courses were loaded for those semesters — so when NTU lists a new
 * semester before it is scraped, /mods defaults to an empty semester, the
 * timetable builder fetches an indexes file that 404s, and every module renders
 * the "not offered in the current semester" banner.
 *
 * Deliberately NOT ordered by insertion order or list position either: the
 * portal's own ordering is not self-consistent (AY2025 lists 2,1,S while AY2024
 * lists 1,2,S), and backfilling an old semester would make "most recently
 * inserted" wrong.
 */
export const LATEST_SEMESTER_SQL = `
  SELECT sem, code, year, semester, name
    FROM semesters
   WHERE EXISTS (SELECT 1 FROM offerings o WHERE o.sem = semesters.sem)
   ORDER BY sort_key DESC
   LIMIT 1
`

/**
 * One offering, with its programme keys rolled up into a JSON array.
 *
 * The ORDER BY sits in an inner subquery, not alongside the aggregate. A
 * trailing `ORDER BY` in the same SELECT as `json_group_array` would sort the
 * single aggregated row rather than the values being aggregated, and the
 * `json_group_array(x ORDER BY y)` form needs SQLite 3.44+. Ordering the rows
 * before they reach the aggregate works on both runtimes — and the order is
 * load-bearing, since getModuleFaculty is last-match-wins over this array.
 */
export const OFFERING_SQL = `
  SELECT o.*,
         (SELECT json_group_array(key) FROM (
            SELECT p.key AS key
              FROM offering_programmes op
              JOIN programmes p ON p.id = op.programme_id
             WHERE op.code = o.code AND op.sem = o.sem
             ORDER BY op.seq
         )) AS search_keys
    FROM offerings o
   WHERE o.code = ? AND o.sem = ?
`

/** Prerequisite groups for one offering, ordered so they rebuild the source nesting. */
export const OFFERING_PREREQUISITES_SQL = `
  SELECT group_no, item_no, raw_text
    FROM prerequisites
   WHERE code = ? AND sem = ?
   ORDER BY group_no, item_no
`

/** Every class slot for one offering, ordered so they rebuild the source arrays. */
export const OFFERING_SLOTS_SQL = `
  SELECT index_key, slot_no, type, grp, day, time, venue, remarks, duration
    FROM class_slots
   WHERE code = ? AND sem = ?
   ORDER BY index_key, slot_no
`

/** Index keys for one offering, including indexes that have no slots. */
export const OFFERING_INDEX_KEYS_SQL = `
  SELECT index_key FROM class_indexes WHERE code = ? AND sem = ? ORDER BY index_key
`

export const OFFERING_EXAM_SQL = `
  SELECT code, date, day, start_time, end_time, name, duration
    FROM exams
   WHERE code = ? AND sem = ?
`

/**
 * The rest of these back getLatestModuleSnapshot — the fallback for module
 * codes not in the active semester (so not statically built). It needs a
 * few things repo.ts gets for free from the in-memory JSON index
 * (moduleSemestersIndex): which semester is "current" for an arbitrary code,
 * its other offerings, and its prerequisite graph neighbourhood.
 */

/** A code's most recent offering — mirrors moduleSemestersIndex()[0] in json-source.ts. */
export const MODULE_LATEST_SEM_SQL = `
  SELECT s.sem AS sem, s.year AS year, s.semester AS semester
    FROM offerings o
    JOIN semesters s ON s.sem = o.sem
   WHERE o.code = ?
   ORDER BY s.sort_key DESC
   LIMIT 1
`

/** Every other semester a code was offered in, newest first. */
export const MODULE_OTHER_SEMESTERS_SQL = `
  SELECT s.year AS year, s.semester AS semester
    FROM offerings o
    JOIN semesters s ON s.sem = o.sem
   WHERE o.code = ? AND o.sem != ?
   ORDER BY s.sort_key DESC
`

/** Prerequisite codes for one offering — requires_code is null for the ~30% of items that are free text, not a module code. */
export const MODULE_REQUIRES_SQL = `
  SELECT DISTINCT requires_code AS code
    FROM prerequisites
   WHERE code = ? AND sem = ? AND requires_code IS NOT NULL
`

/**
 * Codes that list this one as a prerequisite, as of THEIR most recent
 * offering — the inverse edge for the prerequisite graph. Mirrors the
 * `requiredBy` half of json-source.ts's getPrerequisiteGraph, restricted the
 * same way (each requiring module counted only at its latest offering).
 */
export const MODULE_REQUIRED_BY_SQL = `
  SELECT DISTINCT p.code AS code
    FROM prerequisites p
   WHERE p.requires_code = ?
     AND p.sem = (
       SELECT s.sem FROM offerings o JOIN semesters s ON s.sem = o.sem
        WHERE o.code = p.code ORDER BY s.sort_key DESC LIMIT 1
     )
`

/** Titles for a small, known set of codes (prerequisite-graph neighbours), each at ITS OWN latest offering. */
export function buildModuleTitlesSql(count: number): string {
  const placeholders = Array(count).fill("?").join(", ")
  return `
    SELECT code, title FROM (
      SELECT o.code AS code, o.title AS title,
             ROW_NUMBER() OVER (
               PARTITION BY o.code ORDER BY s.sort_key DESC
             ) AS rn
        FROM offerings o
        JOIN semesters s ON s.sem = o.sem
       WHERE o.code IN (${placeholders})
    )
    WHERE rn = 1
  `
}

/** Sibling modules sharing this code's two-letter prefix, offered in the same semester — mirrors related-modules.tsx's filter. */
export const MODULE_RELATED_SQL = `
  SELECT code, title FROM offerings
   WHERE sem = ? AND code LIKE ? AND code != ?
   ORDER BY code
`
