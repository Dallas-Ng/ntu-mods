/**
 * Bootstrap loader: src/data/api/*.json  ->  a local SQLite file.
 *
 * The one-off backfill of the 45 existing semesters from the JSON already in
 * the repo. No rescrape is needed; it is the same data. Also the fallback used
 * by scripts/db/ensure-db.mjs when a build has no way to reach D1.
 *
 * Row construction is shared with the pipeline loader via ./rows.mjs, so
 * `yarn db:verify` proving this output correct also covers load-semester.mjs.
 *
 *   node scripts/db/build-db.mjs [--out db/ntu-mods.sqlite]
 */

import fs from "fs"
import path from "path"
import { DatabaseSync } from "node:sqlite"

import { ROOT, parseSem, semesterName } from "./derive.mjs"
import {
  hashOf,
  prepareAll,
  recordLoad,
  upsertSemester,
  writeCourses,
  writeExams,
} from "./rows.mjs"

const SRC = path.join(ROOT, "src/data/api")
const MIGRATION = path.join(ROOT, "db/migrations/0001_init.sql")

const outArg = process.argv.indexOf("--out")
const OUT = path.join(
  ROOT,
  outArg > -1 ? process.argv[outArg + 1] : "db/ntu-mods.sqlite"
)

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf-8"))

/** Semesters present on disk, plus the portal's names where we have them. */
function collectSemesters() {
  const portalNames = new Map(
    readJson(path.join(SRC, "semesters.json")).map((s) => [
      s.code.replace(";", "_"),
      s.name,
    ])
  )

  return fs
    .readdirSync(path.join(SRC, "metadata"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .map((sem) => {
      const parsed = parseSem(sem)
      return {
        ...parsed,
        name: portalNames.get(sem) ?? semesterName(parsed.year, parsed.semester),
      }
    })
    .sort((a, b) => a.sortKey - b.sortKey)
}

function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  for (const p of [OUT, `${OUT}-wal`, `${OUT}-shm`]) fs.rmSync(p, { force: true })

  const db = new DatabaseSync(OUT)
  db.exec("PRAGMA journal_mode = WAL")
  db.exec(fs.readFileSync(MIGRATION, "utf-8"))

  const stmts = prepareAll(db)
  const semesters = collectSemesters()
  const loadedAt = new Date().toISOString()
  const conflicts = []
  const totals = {}
  const bump = (k, n = 1) => (totals[k] = (totals[k] ?? 0) + n)

  db.exec("BEGIN")
  for (const s of semesters) upsertSemester(db, s.sem, s.name)

  for (const s of semesters) {
    const metadata = readJson(path.join(SRC, "metadata", `${s.sem}.json`))
    const indexes = readJson(path.join(SRC, "indexes", `${s.sem}.json`))
    const counts = writeCourses(db, s.sem, { metadata, indexes }, { stmts, conflicts })
    recordLoad(db, s.sem, "courses", counts, hashOf([metadata, indexes]), loadedAt, {
      stmts,
    })

    const examPath = path.join(SRC, "exams", `${s.sem}.json`)
    let examCounts = { exams: 0 }
    if (fs.existsSync(examPath)) {
      const exams = readJson(examPath)
      examCounts = writeExams(db, s.sem, exams, { stmts })
      recordLoad(db, s.sem, "exams", examCounts, hashOf(exams), loadedAt, { stmts })
    }

    for (const [k, v] of Object.entries(counts)) bump(k, v)
    bump("exams", examCounts.exams)
    process.stdout.write(
      `  ${s.sem}  offerings=${String(counts.offerings).padStart(4)}` +
        `  indexes=${String(counts.class_indexes).padStart(5)}` +
        `  slots=${String(counts.class_slots).padStart(6)}` +
        `  exams=${examCounts.exams}\n`
    )
  }
  db.exec("COMMIT")

  db.exec("PRAGMA wal_checkpoint(TRUNCATE)")
  db.exec("VACUUM")
  db.exec("PRAGMA optimize")

  const scalar = (sql) => db.prepare(sql).get().n
  const distinctCodes = scalar(`SELECT COUNT(DISTINCT code) AS n FROM offerings`)
  const programmeCount = scalar(`SELECT COUNT(*) AS n FROM programmes`)
  const freeText = scalar(
    `SELECT COUNT(*) AS n FROM prerequisites WHERE requires_code IS NULL`
  )
  db.close()

  console.log(`\n${OUT}`)
  console.log(`  semesters             ${semesters.length}`)
  console.log(`  distinct module codes ${distinctCodes}`)
  for (const [k, v] of Object.entries(totals)) console.log(`  ${k.padEnd(21)} ${v}`)
  console.log(`  programmes            ${programmeCount}`)
  console.log(
    `  free-text prereqs     ${freeText} / ${totals.prerequisites}` +
      ` (${((freeText / totals.prerequisites) * 100).toFixed(1)}%)`
  )
  console.log(`  size                  ${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB`)

  if (conflicts.length) {
    console.log(`\n${conflicts.length} conflict(s):`)
    for (const c of conflicts.slice(0, 20)) console.log(`  ${c}`)
  }
}

main()
