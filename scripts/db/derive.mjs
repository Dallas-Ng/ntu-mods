/**
 * Load-time derivations shared by the JSON bootstrap loader and (later) the
 * scraper loader.
 *
 * Everything here is *intra-semester*: it depends only on data inside a single
 * offering, so precomputing it at load is safe. Cross-semester facts
 * (is_current, latest_sem) are deliberately NOT here — they are derived at read
 * time, because loading one semester would otherwise falsify a stored value on
 * every other row.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.join(__dirname, "../..")

/**
 * Faculty keys, read straight out of src/lib/constants.ts rather than
 * duplicated, so the two can never drift. Order matters: the rule is
 * last-match-wins, and the original iterated the object in insertion order.
 */
function readFacultyKeys() {
  const src = fs.readFileSync(
    path.join(ROOT, "src/lib/constants.ts"),
    "utf-8"
  )
  const block = src.match(
    /export const MODULE_FACULTY = \{([\s\S]*?)\n\} as const/
  )
  if (!block) throw new Error("Could not locate MODULE_FACULTY in constants.ts")
  const keys = [...block[1].matchAll(/^\s*([A-Z]+):/gm)].map((m) => m[1])
  if (keys.length < 20) throw new Error(`Parsed only ${keys.length} faculty keys`)
  return keys
}

export const FACULTY_KEYS = readFacultyKeys()

/**
 * A module's faculty, from its programme keys.
 *
 * This is now the only implementation — it replaced src/lib/get-module-faculty.ts,
 * which ran in the browser on every card render. Behaviour is preserved exactly:
 * the last matching segment across all searchKeys wins, and the result is "" if
 * nothing matches.
 */
export function deriveFaculty(searchKeys) {
  let result = ""
  for (const term of searchKeys) {
    for (const segment of term.split(";")) {
      for (const faculty of FACULTY_KEYS) {
        if (segment === faculty) result = segment
      }
    }
  }
  return result
}

/**
 * A module's categories, from its programme keys.
 *
 * This replaced src/lib/get-module-category.ts and reproduces it exactly,
 * INCLUDING its bugs, so the migration is provably behaviour-preserving:
 *
 *   - The CORE test is `some searchKey has 4 semicolon-separated segments`, but
 *     all 744 distinct searchKeys in the corpus have exactly 4 segments. So
 *     every offering with at least one searchKey is tagged CORE. The test that
 *     was almost certainly intended is "segment 2 is a study year (1-5)"
 *     rather than the "X" used by the GLOAD/MLOAD/GERP/USP/CNY/EP buckets.
 *   - "USP" maps to CNY, not USP.
 *   - The chain is else-if, so a key containing two markers only counts once.
 *
 * Fixing either is a deliberate behaviour change and belongs in its own commit.
 */
export function deriveCategories(searchKeys) {
  const included = new Set()

  if (searchKeys.find((x) => x.split(";").length === 4)) included.add("CORE")

  for (const key of searchKeys) {
    if (key.includes("GLOAD")) included.add("GLOAD")
    else if (key.includes("MLOAD")) included.add("MLOAD")
    else if (key.includes("GERP")) included.add("GERP")
    else if (key.includes("CNY")) included.add("CNY")
    else if (key.includes("USP")) included.add("CNY")
  }

  return Array.from(included)
}

/** True when the programme key describes a programme core rather than a load bucket. */
export function programmeIsCore(key) {
  const year = key.split(";")[2]
  return /^[0-9]$/.test(year) ? 1 : 0
}

/** Faculty for a single programme key (same last-match-wins rule, one key). */
export function programmeFaculty(key) {
  return deriveFaculty([key]) || null
}

/** "1430-1720" -> { startMin: 870, endMin: 1040 }. "" -> nulls. */
export function parseTimeRange(time) {
  const m = /^(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(time ?? "")
  if (!m) return { startMin: null, endMin: null }
  return {
    startMin: Number(m[1]) * 60 + Number(m[2]),
    endMin: Number(m[3]) * 60 + Number(m[4]),
  }
}

/**
 * Chronological ordering key. Special Term and Teaching Term run after
 * Semester 2 of the same academic year.
 *
 * Never derive ordering from the portal's list position: its own ordering is
 * inconsistent (AY2025 lists 2,1,S while AY2024 lists 1,2,S), which is what
 * makes `main.py --from` silently skip semesters.
 */
export const SEM_ORDER = { 1: 1, 2: 2, S: 3, T: 4 }

export function sortKey(year, semester) {
  const rank = SEM_ORDER[semester]
  if (rank === undefined) throw new Error(`Unknown semester type: ${semester}`)
  return Number(year) * 10 + rank
}

/** "2025_2" -> { sem, code, year, semester, sortKey } */
export function parseSem(sem) {
  const idx = sem.indexOf("_")
  const year = sem.slice(0, idx)
  const semester = sem.slice(idx + 1)
  return {
    sem,
    code: `${year};${semester}`,
    year,
    semester,
    sortKey: sortKey(year, semester),
  }
}

const SEM_LABEL = {
  1: "Semester 1",
  2: "Semester 2",
  S: "Special Term",
  T: "Teaching Term",
}

/** Fallback name for semesters older than the portal's current catalogue. */
export function semesterName(year, semester) {
  return `Acad Yr ${year} ${SEM_LABEL[semester] ?? `Semester ${semester}`}`
}

/** Same test build-static-data.mjs uses to decide if a prerequisite is a code. */
export const MODULE_CODE_RE = /^[A-Z]{2,6}\d{4}[A-Z]?$/
