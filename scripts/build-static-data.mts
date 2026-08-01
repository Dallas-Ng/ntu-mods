/**
 * Prebuild: generate the static data files the client fetches, from the module
 * database rather than from hand-rolled JSON aggregation.
 *
 * Requests to static assets are free and unmetered on Workers, and the
 * timetable generator genuinely needs a whole semester's index set in the
 * browser at once — so these stay bulk static artifacts. What changed is where
 * they come from: SQL against db/ntu-mods.sqlite instead of reading and
 * merging 139 JSON files.
 *
 * Emitted (all consumed by client code — see the fetch call sites named below):
 *   public/data/api/indexes/{sem}.json   use-season-indexes.ts
 *   public/data/api/exams/{sem}.json     use-season-exams.ts, timetable-overview.tsx
 *   public/data/api/modules.json         use-all-modules.ts
 *   public/data/api/random-samples.json  settings/table-settings.tsx
 *   src/data/api/semesters.json          bundled by src/lib/semesters.ts and exams/index.astro
 *
 * No longer emitted:
 *   public/data/api/metadata/    was read only by the on-demand snapshot route,
 *                                which now queries D1 directly.
 *   src/data/api/prerequisite-graph.json  db/repo.ts now queries SQL.
 *   public/data/api/semesters.json        nothing fetched it; it is only ever
 *                                         imported into the bundle from src/.
 */

import fs from "fs/promises"
import path from "path"
import { DatabaseSync } from "node:sqlite"

import {
  LATEST_SEMESTER_SQL,
  MODULE_SUMMARY_SQL
} from "../src/lib/server/db/queries.ts"

const ROOT = path.join(import.meta.dirname, "..")
const SRC_DATA = path.join(ROOT, "src/data/api")
const PUBLIC_DATA = path.join(ROOT, "public/data/api")
const DB_PATH = process.env.NTU_MODS_DB
  ? path.resolve(process.env.NTU_MODS_DB)
  : path.join(ROOT, "db/ntu-mods.sqlite")

const write = (p, value) => fs.writeFile(p, JSON.stringify(value))

/**
 * Rebuilds `{ [code]: { [indexKey]: Index[] } }` for one semester.
 *
 * Index keys come from class_indexes rather than being inferred from the slot
 * rows, because 24 offerings across the corpus have an index with no slots and
 * the previous artifact represented those as present-but-empty.
 */
function semesterIndexes(db, sem) {
  const result = {}
  for (const r of db
    .prepare(
      `SELECT code FROM offerings WHERE sem = ? ORDER BY code`
    )
    .all(sem)) {
    result[r.code] = {}
  }
  for (const r of db
    .prepare(
      `SELECT code, index_key FROM class_indexes WHERE sem = ? ORDER BY code, index_key`
    )
    .all(sem)) {
    ;(result[r.code] ??= {})[r.index_key] = []
  }
  for (const s of db
    .prepare(
      `SELECT code, index_key, type, grp, day, time, venue, remarks, duration
         FROM class_slots WHERE sem = ? ORDER BY code, index_key, slot_no`
    )
    .all(sem)) {
    ;((result[s.code] ??= {})[s.index_key] ??= []).push({
      key: s.index_key,
      type: s.type,
      group: s.grp,
      day: s.day,
      time: s.time,
      venue: s.venue,
      remarks: s.remarks,
      duration: s.duration,
    })
  }
  return result
}

function semesterExams(db, sem) {
  const result = {}
  for (const r of db
    .prepare(
      `SELECT code, date, day, start_time, end_time, name, duration
         FROM exams WHERE sem = ? ORDER BY code`
    )
    .all(sem)) {
    result[r.code] = {
      date: r.date,
      day: r.day,
      start_time: r.start_time,
      end_time: r.end_time,
      key: r.code,
      name: r.name,
      duration: r.duration,
    }
  }
  return result
}

/**
 * One entry per module code, taken from its most recent offering — the payload
 * behind /mods and the module search.
 *
 * Exactly the AllModule shape in src/types/mods.ts and nothing more. It used to
 * carry the whole metadata record: every restriction field, the description,
 * the prerequisite nesting, and the raw `searchKeys` programme codes, none of
 * which the list view reads. searchKeys in particular was shipped to the
 * browser only to be re-parsed on every card render and every filter pass to
 * work out faculty and category — both are now precomputed columns.
 *
 * The full record is still available per module: prerendered into the page by
 * getModuleMetadata, or queried from D1 by the snapshot route.
 */
function buildModules(db, latestSem) {
  const rows = db.prepare(MODULE_SUMMARY_SQL).all(latestSem)

  const modules = rows.map((r) => {
    const sep = r.latest_sem.indexOf("_")
    const module = {
      code: r.code,
      title: r.title,
      au: r.au,
      faculty: r.faculty ?? "",
      categories: JSON.parse(r.categories ?? "[]"),
      latestYear: r.latest_sem.slice(0, sep),
      latestSemester: r.latest_sem.slice(sep + 1),
      isCurrentSemester: r.is_current === 1
    }
    if (r.not_available_to_programme !== null) {
      module.notAvailableToProgramme = r.not_available_to_programme
    }
    return module
  })

  return { modules }
}

/** 200 sampled modules with one real timetabled slot each, for the settings preview. */
function buildRandomSamples(db, latestSem) {
  const rows = db
    .prepare(
      `SELECT o.code, o.title, o.au, s.index_key, s.type, s.grp, s.day, s.time,
              s.venue, s.remarks, s.duration
         FROM offerings o
         JOIN class_slots s ON s.code = o.code AND s.sem = o.sem
        WHERE o.sem = ? AND s.day IS NOT NULL AND s.day <> 0
        ORDER BY o.code, s.index_key, s.slot_no`
    )
    .all(latestSem)

  // Group by module, then pick one module at a time so a module with many
  // slots is not over-represented — matching the previous one-sample-per-module
  // behaviour.
  const byCode = new Map()
  for (const r of rows) {
    let list = byCode.get(r.code)
    if (!list) byCode.set(r.code, (list = []))
    list.push(r)
  }

  const codes = [...byCode.keys()].sort(() => Math.random() - 0.5)
  const samples = []
  for (const code of codes) {
    if (samples.length >= 200) break
    const slots = byCode.get(code)
    const r = slots[Math.floor(Math.random() * slots.length)]
    samples.push({
      code,
      title: r.title,
      au: r.au,
      indexKey: r.index_key,
      index: {
        key: r.index_key,
        type: r.type,
        group: r.grp,
        day: r.day,
        time: r.time,
        venue: r.venue,
        remarks: r.remarks,
        duration: r.duration,
      },
    })
  }
  return samples
}

/**
 * The semester catalogue, newest first, restricted to semesters that actually
 * have offerings.
 *
 * This used to be the portal's list straight from scraper step 1, scraped
 * independently of whether step 2 had loaded any courses for those semesters —
 * so a newly listed but unscraped semester made src/lib/semesters.ts point at
 * an empty term, and every module rendered the not-offered banner. Ordering is
 * by sort_key rather than the portal's list order, which is not self-consistent
 * (AY2025 lists 2,1,S while AY2024 lists 1,2,S).
 */
function buildSemesters(db) {
  return db
    .prepare(
      `SELECT code, name FROM semesters
        WHERE EXISTS (SELECT 1 FROM offerings o WHERE o.sem = semesters.sem)
        ORDER BY sort_key DESC`
    )
    .all()
    .map((r) => ({ code: r.code, name: r.name }))
}

async function main() {
  console.log("Building static data from the module database...")

  let db
  try {
    db = new DatabaseSync(DB_PATH, { readOnly: true })
  } catch {
    throw new Error(
      `Module database not found or unreadable at ${DB_PATH}.\n` +
        `Run \`yarn db:pull\` to download it from D1, or \`yarn db:build\` to ` +
        `rebuild it from src/data/api.`
    )
  }

  const latestSem = db.prepare(LATEST_SEMESTER_SQL).get()?.sem
  if (!latestSem) throw new Error("No semester in the database has any offerings")
  console.log(`  latest semester with data: ${latestSem}`)

  const semesters = db.prepare(`SELECT sem FROM semesters ORDER BY sort_key`).all()

  await fs.mkdir(path.join(PUBLIC_DATA, "indexes"), { recursive: true })
  await fs.mkdir(path.join(PUBLIC_DATA, "exams"), { recursive: true })

  let indexFiles = 0
  let examFiles = 0
  for (const { sem } of semesters) {
    await write(path.join(PUBLIC_DATA, "indexes", `${sem}.json`), semesterIndexes(db, sem))
    indexFiles++
    await write(path.join(PUBLIC_DATA, "exams", `${sem}.json`), semesterExams(db, sem))
    examFiles++
  }
  console.log(`  Wrote ${indexFiles} indexes/*.json and ${examFiles} exams/*.json`)

  const modules = buildModules(db, latestSem)
  await write(path.join(PUBLIC_DATA, "modules.json"), modules)
  console.log(`  Built modules.json (${modules.modules.length} modules)`)

  const samples = buildRandomSamples(db, latestSem)
  await write(path.join(PUBLIC_DATA, "random-samples.json"), samples)
  console.log(`  Built random-samples.json (${samples.length} samples)`)

  const semesterList = buildSemesters(db)
  await write(path.join(SRC_DATA, "semesters.json"), semesterList)
  console.log(
    `  Built semesters.json (${semesterList.length} semesters, latest ${semesterList[0].code})`
  )

  db.close()
  console.log("Done.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
