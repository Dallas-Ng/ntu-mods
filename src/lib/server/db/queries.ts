/**
 * SQL shared between the two runtimes.
 *
 * The same schema is queried by `node:sqlite` at build time and by the D1
 * binding at request time — one SQLite file, two runtimes — so any query used
 * by both lives here rather than being written twice.
 *
 * These are plain strings with `?` placeholders, which is the intersection of
 * what `node:sqlite` and D1 both accept. Every export here is called through a
 * named function in db/repo.ts (or, for the one on-demand route,
 * edge/get-module-snapshot.ts) — not from a page or component directly.
 */

/**
 * Ranks each module's offerings newest-first so a query can filter to `rn = 1`
 * for "as of its most recent offering." Five call sites need exactly this
 * shape with different column lists, so the shape is shared and the columns
 * are not.
 */
const latestOfferingRanked = (columns: string) => `
  ranked AS (
    SELECT ${columns},
           ROW_NUMBER() OVER (PARTITION BY o.code ORDER BY s.sort_key DESC) AS rn
      FROM offerings o
      JOIN semesters s ON s.sem = o.sem
  )
`

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
 * Every module code that was ever offered — replaces module-map.json, which the
 * scraper built by merging all 45 metadata files. Drives getStaticPaths for
 * /mods/:code and the sitemap.
 */
export const ALL_MODULE_CODES_SQL = `
  SELECT DISTINCT code FROM offerings ORDER BY code
`

/**
 * Each module's code and title as of its most recent offering, for the sitemap
 * page's alphabetical listing.
 */
export const MODULE_TITLES_SQL = `
  WITH ${latestOfferingRanked("o.code, o.title")}
  SELECT code, title FROM ranked WHERE rn = 1 ORDER BY code
`

/**
 * Versioned module pages for the sitemap: every offering from `year_cutoff`
 * onwards, excluding each module's current offering (which redirects to
 * /mods/:code and so must stay out of the sitemap).
 */
export const SITEMAP_VERSIONED_OFFERINGS_SQL = `
  WITH ${latestOfferingRanked("o.code, o.sem, s.year, s.semester, s.sort_key")}
  SELECT code, year, semester FROM ranked
   WHERE rn > 1 AND CAST(year AS INTEGER) >= ?
   ORDER BY code, sort_key DESC
`

/** Latest semester that has at least one exam — replaces the exams page's fallback loop. */
export const LATEST_EXAM_SEMESTER_SQL = `
  SELECT sem, code, year, semester, name
    FROM semesters
   WHERE EXISTS (SELECT 1 FROM exams e WHERE e.sem = semesters.sem)
   ORDER BY sort_key DESC
   LIMIT 1
`

/** All semesters a module was offered in, newest first. */
export const MODULE_SEMESTERS_SQL = `
  SELECT s.sem, s.year, s.semester
    FROM offerings o
    JOIN semesters s ON s.sem = o.sem
   WHERE o.code = ?
   ORDER BY s.sort_key DESC
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

/** Every offering in one semester — same shape as OFFERING_SQL, unfiltered by code. */
export const SEMESTER_OFFERINGS_SQL = `
  SELECT o.*,
         (SELECT json_group_array(key) FROM (
            SELECT p.key AS key
              FROM offering_programmes op
              JOIN programmes p ON p.id = op.programme_id
             WHERE op.code = o.code AND op.sem = o.sem
             ORDER BY op.seq
         )) AS search_keys
    FROM offerings o
   WHERE o.sem = ?
   ORDER BY o.code
`

/** Prerequisite groups for one offering, ordered so they rebuild the source nesting. */
export const OFFERING_PREREQUISITES_SQL = `
  SELECT group_no, item_no, raw_text
    FROM prerequisites
   WHERE code = ? AND sem = ?
   ORDER BY group_no, item_no
`

/** Prerequisite groups for every offering in one semester — same shape as OFFERING_PREREQUISITES_SQL, unfiltered by code. */
export const SEMESTER_PREREQUISITES_SQL = `
  SELECT code, group_no, item_no, raw_text
    FROM prerequisites
   WHERE sem = ?
   ORDER BY code, group_no, item_no
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

/** Every exam in one semester, keyed by module code. */
export const SEMESTER_EXAMS_SQL = `
  SELECT code, date, day, start_time, end_time, name, duration
    FROM exams WHERE sem = ? ORDER BY code
`

/**
 * Each module's title as of its most recent offering, plus `sem` so
 * PREREQUISITE_GRAPH_EDGES_SQL can join to the same "latest" row.
 */
export const PREREQUISITE_GRAPH_TITLES_SQL = `
  WITH ${latestOfferingRanked("o.code, o.sem, o.title")}
  SELECT code, title FROM ranked WHERE rn = 1
`

/**
 * requires_code edges out of each module's most recent offering. Only items
 * that resolve to a module code become edges — the rest are free text and
 * cannot be graph edges.
 */
export const PREREQUISITE_GRAPH_EDGES_SQL = `
  WITH ${latestOfferingRanked("o.code, o.sem, o.title")}
  SELECT DISTINCT r.code AS code, p.requires_code AS requires
    FROM ranked r
    JOIN prerequisites p ON p.code = r.code AND p.sem = r.sem
   WHERE r.rn = 1 AND p.requires_code IS NOT NULL
   ORDER BY r.code, p.requires_code
`

/**
 * One row per module code, taken from its newest semester. Replaces
 * modules.json and module-map.json. `:latest_sem` is bound, not subqueried,
 * so the caller decides what "current" means in one place.
 */
export const MODULE_SUMMARY_SQL = `
  WITH ${latestOfferingRanked("o.code, o.sem, o.title, o.au, o.faculty, o.categories, o.not_available_to_programme")}
  SELECT code,
         substr(code, 1, 2)                  AS prefix,
         CAST(substr(code, 3, 1) AS INTEGER) AS level,
         title, au, faculty, categories, not_available_to_programme,
         sem AS latest_sem,
         CASE WHEN sem = ? THEN 1 ELSE 0 END AS is_current
    FROM ranked
   WHERE rn = 1
   ORDER BY code
`
