/**
 * Get a local copy of db/ntu-mods.sqlite, either by rebuilding it from
 * src/data/api JSON or by downloading it from D1.
 *
 * `--if-missing` is what `yarn data` uses before every build: CI has no
 * wrangler credentials, so it can't `wrangler d1 export`, and rebuilding from
 * JSON on every build would be wasted work once a database is already checked
 * out. That fallback is the only reason src/data/api is still in the repo —
 * once the build can pull from D1 directly (an API token in the Workers
 * Builds environment, or the file staged in R2), `--from json` and the JSON
 * tree it reads can both be deleted.
 *
 *   node scripts/db/sync-db.mjs --from json
 *   node scripts/db/sync-db.mjs --from json --if-missing
 *   node scripts/db/sync-db.mjs --from d1 [--database ntu-mods-dev] [--out db/ntu-mods.sqlite]
 */

import { execFileSync } from "child_process"
import fs from "fs"
import path from "path"
import { DatabaseSync } from "node:sqlite"

import { ROOT, parseSem, semesterName } from "./lib/derive.mjs"
import {
  hashOf,
  prepareAll,
  recordLoad,
  upsertSemester,
  writeCourses,
  writeExams
} from "./lib/rows.mjs"

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : fallback
}
const flag = (name) => process.argv.includes(`--${name}`)

const FROM = arg("from")
const OUT = path.join(ROOT, arg("out", "db/ntu-mods.sqlite"))

if (FROM !== "json" && FROM !== "d1") {
  console.error(
    "Usage: node scripts/db/sync-db.mjs --from json|d1 [--if-missing] " +
      "[--out path] [--database name]"
  )
  process.exit(1)
}

if (flag("if-missing") && fs.existsSync(OUT)) {
  process.exit(0)
}

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf-8"))

/** Semesters present on disk, plus the portal's names where we have them. */
function collectSemesters(src) {
  const portalNames = new Map(
    readJson(path.join(src, "semesters.json")).map((s) => [
      s.code.replace(";", "_"),
      s.name
    ])
  )

  return fs
    .readdirSync(path.join(src, "metadata"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .map((sem) => {
      const parsed = parseSem(sem)
      return {
        ...parsed,
        name: portalNames.get(sem) ?? semesterName(parsed.year, parsed.semester)
      }
    })
    .sort((a, b) => a.sortKey - b.sortKey)
}

/**
 * Bootstrap loader: src/data/api/*.json -> a local SQLite file. Row
 * construction is shared with the pipeline loader via lib/rows.mjs, so
 * `yarn db:verify` proving this output correct also covers load-semester.mjs.
 */
function buildFromJson() {
  const src = path.join(ROOT, "src/data/api")
  if (!fs.existsSync(path.join(src, "metadata"))) {
    console.error(
      `No src/data/api to rebuild from.\nRun \`yarn db:pull\` to download ` +
        `the database from D1 instead.`
    )
    process.exit(1)
  }

  const migration = path.join(ROOT, "db/migrations/0001_init.sql")

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  for (const p of [OUT, `${OUT}-wal`, `${OUT}-shm`]) fs.rmSync(p, { force: true })

  const db = new DatabaseSync(OUT)
  db.exec("PRAGMA journal_mode = WAL")
  db.exec(fs.readFileSync(migration, "utf-8"))

  const stmts = prepareAll(db)
  const semesters = collectSemesters(src)
  const loadedAt = new Date().toISOString()
  const conflicts = []
  const totals = {}
  const bump = (k, n = 1) => (totals[k] = (totals[k] ?? 0) + n)

  db.exec("BEGIN")
  for (const s of semesters) upsertSemester(db, s.sem, s.name)

  for (const s of semesters) {
    const metadata = readJson(path.join(src, "metadata", `${s.sem}.json`))
    const indexes = readJson(path.join(src, "indexes", `${s.sem}.json`))
    const counts = writeCourses(db, s.sem, { metadata, indexes }, { stmts, conflicts })
    recordLoad(db, s.sem, "courses", counts, hashOf([metadata, indexes]), loadedAt, {
      stmts
    })

    const examPath = path.join(src, "exams", `${s.sem}.json`)
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

/**
 * Download D1 into the local SQLite file the build reads. D1 is the source of
 * truth; this file is a derived read replica, rebuilt before each build.
 * `wrangler d1 export` emits SQL rather than a SQLite file (there is no binary
 * export), so this replays it through `node:sqlite`.
 */
function pullFromD1() {
  const database = arg("database", process.env.NTU_MODS_D1 ?? "ntu-mods-dev")
  const dump = path.join(ROOT, "db/out/export.sql")

  fs.mkdirSync(path.dirname(dump), { recursive: true })
  console.log(`Exporting ${database} ...`)
  execFileSync(
    "npx",
    ["wrangler", "d1", "export", database, "--remote", "--output", dump],
    { stdio: "inherit" }
  )

  const sql = fs.readFileSync(dump, "utf-8")

  const tmp = `${OUT}.tmp`
  for (const p of [tmp, `${tmp}-wal`, `${tmp}-shm`]) fs.rmSync(p, { force: true })

  const db = new DatabaseSync(tmp)
  db.exec("PRAGMA journal_mode = WAL")
  db.exec(sql)
  db.exec("PRAGMA wal_checkpoint(TRUNCATE)")

  const counts = db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM semesters) semesters,
              (SELECT COUNT(*) FROM offerings) offerings,
              (SELECT COUNT(*) FROM class_slots) class_slots`
    )
    .get()
  db.close()

  // Swap in only after the replay succeeded, so a failed pull never leaves the
  // build reading a half-written database.
  for (const p of [OUT, `${OUT}-wal`, `${OUT}-shm`]) fs.rmSync(p, { force: true })
  fs.renameSync(tmp, OUT)

  console.log(
    `${OUT}\n  semesters ${counts.semesters}` +
      `  offerings ${counts.offerings}` +
      `  class_slots ${counts.class_slots}` +
      `  ${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB`
  )
}

if (FROM === "json") buildFromJson()
else pullFromD1()
