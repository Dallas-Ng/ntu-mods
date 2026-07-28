/**
 * Bootstrap loader: src/data/api/*.json  ->  a local SQLite file.
 *
 * This is step 2 of D1_MIGRATION_PLAN.md §8 — the one-off backfill of the 45
 * existing semesters from the JSON already in the repo. No rescrape is needed;
 * it is the same data.
 *
 * The scraper loader (step 9) will write the same schema through the same
 * derivations in scripts/db/derive.mjs, scoped to one (semester, scope) at a
 * time. This script is the whole-corpus version of that.
 *
 *   node scripts/db/build-db.mjs [--out db/ntu-mods.sqlite]
 */

import crypto from "crypto"
import fs from "fs"
import path from "path"
import { DatabaseSync } from "node:sqlite"

import {
  MODULE_CODE_RE,
  ROOT,
  deriveCategories,
  deriveFaculty,
  parseSem,
  parseTimeRange,
  programmeFaculty,
  programmeIsCore,
  semesterName,
} from "./derive.mjs"

const SRC = path.join(ROOT, "src/data/api")
const MIGRATION = path.join(ROOT, "db/migrations/0001_init.sql")

const outArg = process.argv.indexOf("--out")
const OUT = path.join(
  ROOT,
  outArg > -1 ? process.argv[outArg + 1] : "db/ntu-mods.sqlite"
)

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf-8"))
const hash = (v) =>
  crypto.createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 16)

/** Semesters present on disk, plus the portal names where we have them. */
function collectSemesters() {
  const onDisk = fs
    .readdirSync(path.join(SRC, "metadata"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))

  const portalNames = new Map(
    readJson(path.join(SRC, "semesters.json")).map((s) => [
      s.code.replace(";", "_"),
      s.name,
    ])
  )

  return onDisk
    .map((sem) => {
      const parsed = parseSem(sem)
      return {
        ...parsed,
        name:
          portalNames.get(sem) ?? semesterName(parsed.year, parsed.semester),
      }
    })
    .sort((a, b) => a.sortKey - b.sortKey)
}

function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.rmSync(OUT, { force: true })
  fs.rmSync(`${OUT}-wal`, { force: true })
  fs.rmSync(`${OUT}-shm`, { force: true })

  const db = new DatabaseSync(OUT)
  db.exec("PRAGMA journal_mode = WAL")
  db.exec(fs.readFileSync(MIGRATION, "utf-8"))

  const ins = {
    semester: db.prepare(
      `INSERT INTO semesters (sem, code, year, semester, name, sort_key)
       VALUES (?, ?, ?, ?, ?, ?)`
    ),
    offering: db.prepare(
      `INSERT INTO offerings (
         code, sem, title, au, faculty, categories, description, grade_type,
         not_available_to_programme, not_available_to_all_programme_with,
         not_available_as_bdeue_to_programme, not_available_as_core_to_programme,
         not_available_as_pe_to_programme, not_offered_as_bde, not_offered_as_ue,
         mutually_exclusive_with, extras
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ),
    programme: db.prepare(
      `INSERT OR IGNORE INTO programmes (key, faculty, is_core) VALUES (?, ?, ?)`
    ),
    offProg: db.prepare(
      `INSERT OR IGNORE INTO offering_programmes (code, sem, programme_id, seq)
       VALUES (?, ?, ?, ?)`
    ),
    classIndex: db.prepare(
      `INSERT INTO class_indexes (code, sem, index_key) VALUES (?, ?, ?)`
    ),
    slot: db.prepare(
      `INSERT INTO class_slots (
         code, sem, index_key, slot_no, type, grp, day, time,
         start_min, end_min, venue, remarks, duration
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ),
    exam: db.prepare(
      `INSERT INTO exams (code, sem, date, day, start_time, end_time, name, duration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ),
    prereq: db.prepare(
      `INSERT OR IGNORE INTO prerequisites
         (code, sem, group_no, item_no, requires_code, raw_text)
       VALUES (?, ?, ?, ?, ?, ?)`
    ),
    load: db.prepare(
      `INSERT INTO loads (sem, scope, loaded_at, source_hash, row_counts)
       VALUES (?, ?, ?, ?, ?)`
    ),
  }

  const programmeIds = new Map()
  const lookupProgramme = db.prepare(`SELECT id FROM programmes WHERE key = ?`)
  const programmeId = (key) => {
    let id = programmeIds.get(key)
    if (id !== undefined) return id
    ins.programme.run(key, programmeFaculty(key), programmeIsCore(key))
    id = lookupProgramme.get(key).id
    programmeIds.set(key, id)
    return id
  }

  const semesters = collectSemesters()
  const loadedAt = new Date().toISOString()
  const totals = {}
  const bump = (k, n = 1) => (totals[k] = (totals[k] ?? 0) + n)

  db.exec("BEGIN")
  for (const s of semesters) {
    ins.semester.run(s.sem, s.code, s.year, s.semester, s.name, s.sortKey)
  }

  for (const s of semesters) {
    const counts = {
      offerings: 0,
      offering_programmes: 0,
      class_indexes: 0,
      class_slots: 0,
      prerequisites: 0,
    }

    // --- scope: courses -------------------------------------------------
    const metadata = readJson(path.join(SRC, "metadata", `${s.sem}.json`))
    for (const [code, m] of Object.entries(metadata)) {
      const searchKeys = m.searchKeys ?? []
      ins.offering.run(
        code,
        s.sem,
        m.title ?? "",
        m.au ?? "0",
        deriveFaculty(searchKeys) || null,
        JSON.stringify(deriveCategories(searchKeys)),
        m.description ?? null,
        m.gradeType ?? null,
        m.notAvailableToProgramme ?? null,
        m.notAvailableToAllProgrammeWith ?? null,
        m.notAvailableAsBdeueToProgramme ?? null,
        m.notAvailableAsCoreToProgramme ?? null,
        m.notAvailableAsPeToProgramme ?? null,
        m.notOfferedAsBde ?? null,
        m.notOfferedAsUe ?? null,
        m.mutuallyExclusiveWith ? JSON.stringify(m.mutuallyExclusiveWith) : null,
        m.extras ? JSON.stringify(m.extras) : null
      )
      counts.offerings++

      searchKeys.forEach((key, seq) => {
        ins.offProg.run(code, s.sem, programmeId(key), seq)
        counts.offering_programmes++
      })

      const groups = Array.isArray(m.prerequisite) ? m.prerequisite : []
      groups.forEach((group, groupNo) => {
        group.forEach((item, itemNo) => {
          const text = String(item)
          ins.prereq.run(
            code,
            s.sem,
            groupNo,
            itemNo,
            MODULE_CODE_RE.test(text) ? text : null,
            text
          )
          counts.prerequisites++
        })
      })
    }

    const indexes = readJson(path.join(SRC, "indexes", `${s.sem}.json`))
    for (const [code, byKey] of Object.entries(indexes)) {
      for (const [indexKey, slots] of Object.entries(byKey)) {
        ins.classIndex.run(code, s.sem, indexKey)
        counts.class_indexes++
        slots.forEach((slot, slotNo) => {
          const { startMin, endMin } = parseTimeRange(slot.time)
          ins.slot.run(
            code,
            s.sem,
            indexKey,
            slotNo,
            slot.type ?? null,
            slot.group ?? null,
            slot.day ?? null,
            slot.time ?? null,
            startMin,
            endMin,
            slot.venue ?? null,
            slot.remarks ?? null,
            slot.duration ?? null
          )
          counts.class_slots++
        })
      }
    }

    ins.load.run(
      s.sem,
      "courses",
      loadedAt,
      hash([metadata, indexes]),
      JSON.stringify(counts)
    )

    // --- scope: exams ---------------------------------------------------
    const examPath = path.join(SRC, "exams", `${s.sem}.json`)
    let examCount = 0
    if (fs.existsSync(examPath)) {
      const exams = readJson(examPath)
      for (const [code, e] of Object.entries(exams)) {
        ins.exam.run(
          code,
          s.sem,
          e.date ?? null,
          e.day ?? null,
          e.start_time ?? null,
          e.end_time ?? null,
          e.name ?? null,
          e.duration ?? null
        )
        examCount++
      }
      ins.load.run(
        s.sem,
        "exams",
        loadedAt,
        hash(exams),
        JSON.stringify({ exams: examCount })
      )
    }

    for (const [k, v] of Object.entries(counts)) bump(k, v)
    bump("exams", examCount)
    process.stdout.write(
      `  ${s.sem}  offerings=${String(counts.offerings).padStart(4)}` +
        `  indexes=${String(counts.class_indexes).padStart(5)}` +
        `  slots=${String(counts.class_slots).padStart(6)}` +
        `  exams=${examCount}\n`
    )
  }
  db.exec("COMMIT")

  db.exec("PRAGMA wal_checkpoint(TRUNCATE)")
  db.exec("VACUUM")
  db.exec("PRAGMA optimize")

  const distinctCodes = db
    .prepare(`SELECT COUNT(DISTINCT code) AS n FROM offerings`)
    .get().n
  const programmeCount = db.prepare(`SELECT COUNT(*) AS n FROM programmes`).get()
    .n
  const freeText = db
    .prepare(`SELECT COUNT(*) AS n FROM prerequisites WHERE requires_code IS NULL`)
    .get().n

  db.close()

  console.log(`\n${OUT}`)
  console.log(`  semesters            ${semesters.length}`)
  console.log(`  distinct module codes ${distinctCodes}`)
  for (const [k, v] of Object.entries(totals)) {
    console.log(`  ${k.padEnd(20)} ${v}`)
  }
  console.log(`  programmes           ${programmeCount}`)
  console.log(
    `  free-text prereqs    ${freeText} / ${totals.prerequisites}` +
      ` (${((freeText / totals.prerequisites) * 100).toFixed(1)}%)`
  )
  console.log(`  size                 ${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB`)
}

main()
