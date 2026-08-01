/**
 * Parity gate.
 *
 * Reconstructs the original JSON shapes out of the database and diffs them
 * against src/data/api/*.json — every module, every semester, not a sample.
 * Nothing may be deleted until this passes clean.
 *
 *   node scripts/db/verify-parity.mjs                # local SQLite build
 *   node scripts/db/verify-parity.mjs --remote       # spot-check remote D1 too
 */

import fs from "fs"
import path from "path"
import { DatabaseSync } from "node:sqlite"

import { d1Query } from "./lib/d1.mjs"
import { ROOT, deriveCategories, deriveFaculty } from "./lib/derive.mjs"

const SRC = path.join(ROOT, "src/data/api")
const DB = path.join(ROOT, "db/ntu-mods.sqlite")

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf-8"))

let failures = 0
const MAX_REPORTED = 20
let reported = 0

function fail(msg) {
  failures++
  if (reported < MAX_REPORTED) {
    console.error(`  FAIL ${msg}`)
    reported++
  } else if (reported === MAX_REPORTED) {
    console.error(`  ... further failures suppressed`)
    reported++
  }
}

/** Deep-equality that treats null and undefined as the same absent value. */
function same(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

function verifySemester(db, sem) {
  // ---- metadata ---------------------------------------------------------
  const metadata = readJson(path.join(SRC, "metadata", `${sem}.json`))

  const offerings = db
    .prepare(`SELECT * FROM offerings WHERE sem = ?`)
    .all(sem)
  const byCode = new Map(offerings.map((o) => [o.code, o]))

  if (offerings.length !== Object.keys(metadata).length) {
    fail(`${sem} offering count ${offerings.length} != ${Object.keys(metadata).length}`)
  }

  const progRows = db
    .prepare(
      `SELECT op.code, p.key, op.seq
         FROM offering_programmes op
         JOIN programmes p ON p.id = op.programme_id
        WHERE op.sem = ?
        ORDER BY op.code, op.seq`
    )
    .all(sem)
  const progByCode = new Map()
  for (const r of progRows) {
    if (!progByCode.has(r.code)) progByCode.set(r.code, [])
    progByCode.get(r.code).push(r.key)
  }

  const prereqRows = db
    .prepare(
      `SELECT code, group_no, item_no, raw_text FROM prerequisites
        WHERE sem = ? ORDER BY code, group_no, item_no`
    )
    .all(sem)
  const prereqByCode = new Map()
  for (const r of prereqRows) {
    if (!prereqByCode.has(r.code)) prereqByCode.set(r.code, [])
    const groups = prereqByCode.get(r.code)
    while (groups.length <= r.group_no) groups.push([])
    groups[r.group_no].push(r.raw_text)
  }

  for (const [code, m] of Object.entries(metadata)) {
    const o = byCode.get(code)
    if (!o) {
      fail(`${sem} ${code} missing from offerings`)
      continue
    }
    if (o.title !== m.title) fail(`${sem} ${code} title`)
    if (o.au !== m.au) fail(`${sem} ${code} au`)
    if (!same(o.description, m.description)) fail(`${sem} ${code} description`)
    if (!same(o.grade_type, m.gradeType)) fail(`${sem} ${code} gradeType`)
    if (!same(o.not_available_to_programme, m.notAvailableToProgramme))
      fail(`${sem} ${code} notAvailableToProgramme`)
    if (!same(o.not_available_to_all_programme_with, m.notAvailableToAllProgrammeWith))
      fail(`${sem} ${code} notAvailableToAllProgrammeWith`)
    if (!same(o.not_available_as_bdeue_to_programme, m.notAvailableAsBdeueToProgramme))
      fail(`${sem} ${code} notAvailableAsBdeueToProgramme`)
    if (!same(o.not_available_as_core_to_programme, m.notAvailableAsCoreToProgramme))
      fail(`${sem} ${code} notAvailableAsCoreToProgramme`)
    if (!same(o.not_available_as_pe_to_programme, m.notAvailableAsPeToProgramme))
      fail(`${sem} ${code} notAvailableAsPeToProgramme`)
    if (!same(o.not_offered_as_bde, m.notOfferedAsBde)) fail(`${sem} ${code} notOfferedAsBde`)
    if (!same(o.not_offered_as_ue, m.notOfferedAsUe)) fail(`${sem} ${code} notOfferedAsUe`)

    const mex = o.mutually_exclusive_with ? JSON.parse(o.mutually_exclusive_with) : null
    if (!same(mex, m.mutuallyExclusiveWith ?? null)) fail(`${sem} ${code} mutuallyExclusiveWith`)

    const extras = o.extras ? JSON.parse(o.extras) : null
    if (!same(extras, m.extras ?? null)) fail(`${sem} ${code} extras`)

    // searchKeys must round-trip through the normalised many-to-many, in order.
    const keys = progByCode.get(code) ?? []
    const expectedKeys = [...new Set(m.searchKeys ?? [])]
    if (!same(keys, expectedKeys)) fail(`${sem} ${code} searchKeys ${JSON.stringify(keys)} != ${JSON.stringify(expectedKeys)}`)

    // Precomputed columns must equal what the client functions produce today.
    if ((o.faculty ?? "") !== deriveFaculty(m.searchKeys ?? []))
      fail(`${sem} ${code} faculty`)
    if (!same(JSON.parse(o.categories), deriveCategories(m.searchKeys ?? [])))
      fail(`${sem} ${code} categories`)

    const prereq = prereqByCode.get(code) ?? null
    const expectedPrereq =
      Array.isArray(m.prerequisite) && m.prerequisite.length
        ? m.prerequisite.map((g) => g.map(String))
        : null
    if (!same(prereq, expectedPrereq)) fail(`${sem} ${code} prerequisite`)
  }

  // ---- indexes ----------------------------------------------------------
  const indexes = readJson(path.join(SRC, "indexes", `${sem}.json`))
  const slotRows = db
    .prepare(
      `SELECT code, index_key, slot_no, type, grp, day, time, venue, remarks, duration
         FROM class_slots WHERE sem = ? ORDER BY code, index_key, slot_no`
    )
    .all(sem)

  const rebuilt = new Map()
  for (const r of slotRows) {
    if (!rebuilt.has(r.code)) rebuilt.set(r.code, new Map())
    const byKey = rebuilt.get(r.code)
    if (!byKey.has(r.index_key)) byKey.set(r.index_key, [])
    byKey.get(r.index_key).push({
      key: r.index_key,
      type: r.type,
      group: r.grp,
      day: r.day,
      time: r.time,
      venue: r.venue,
      remarks: r.remarks,
      duration: r.duration,
    })
  }

  // The metadata and indexes key sets are identical in all 45 semesters, and 24
  // offerings carry an empty `{}` index object. So "code present with no
  // indexes" is fully recoverable from the offerings row — an offering with no
  // class_indexes rows reconstructs as `{}`. Artifact generation must do the
  // same, or those 24 codes would vanish from indexes/{sem}.json.
  for (const [code, byKey] of Object.entries(indexes)) {
    const got = rebuilt.get(code) ?? new Map()
    if (got.size === 0 && Object.keys(byKey).length === 0) {
      if (!byCode.has(code)) fail(`${sem} ${code} empty indexes but no offering row`)
      continue
    }
    for (const [indexKey, slots] of Object.entries(byKey)) {
      if (!same(got.get(indexKey), slots)) fail(`${sem} ${code}/${indexKey} slots`)
    }
    if (got.size !== Object.keys(byKey).length) fail(`${sem} ${code} index key count`)
  }

  // ---- exams ------------------------------------------------------------
  const examPath = path.join(SRC, "exams", `${sem}.json`)
  if (fs.existsSync(examPath)) {
    const exams = readJson(examPath)
    const rows = db.prepare(`SELECT * FROM exams WHERE sem = ?`).all(sem)
    const examByCode = new Map(rows.map((r) => [r.code, r]))
    if (rows.length !== Object.keys(exams).length)
      fail(`${sem} exam count ${rows.length} != ${Object.keys(exams).length}`)
    for (const [code, e] of Object.entries(exams)) {
      const r = examByCode.get(code)
      if (!r) {
        fail(`${sem} ${code} missing from exams`)
        continue
      }
      const got = {
        date: r.date,
        day: r.day,
        start_time: r.start_time,
        end_time: r.end_time,
        key: r.code,
        name: r.name,
        duration: r.duration,
      }
      if (!same(got, e)) fail(`${sem} ${code} exam`)
    }
  }
}

function verifyRemoteSpotCheck() {
  console.log("\nRemote D1 spot-check")
  const local = new DatabaseSync(DB, { readOnly: true })

  const checks = [
    ["offerings", `SELECT COUNT(*) AS n FROM offerings`],
    ["class_slots", `SELECT COUNT(*) AS n FROM class_slots`],
    ["class_indexes", `SELECT COUNT(*) AS n FROM class_indexes`],
    ["offering_programmes", `SELECT COUNT(*) AS n FROM offering_programmes`],
    ["prerequisites", `SELECT COUNT(*) AS n FROM prerequisites`],
    ["exams", `SELECT COUNT(*) AS n FROM exams`],
    [
      "title checksum",
      `SELECT SUM(LENGTH(title)) AS n FROM offerings`,
    ],
    [
      "description checksum",
      `SELECT SUM(LENGTH(COALESCE(description,''))) AS n FROM offerings`,
    ],
    ["venue checksum", `SELECT SUM(LENGTH(COALESCE(venue,''))) AS n FROM class_slots`],
    ["start_min sum", `SELECT SUM(COALESCE(start_min,0)) AS n FROM class_slots`],
  ]

  for (const [label, sql] of checks) {
    const want = local.prepare(sql).get().n
    const got = d1Query(sql)[0].n
    const ok = Number(want) === Number(got)
    if (!ok) fail(`remote ${label}: ${got} != local ${want}`)
    console.log(`  ${ok ? "ok  " : "FAIL"} ${label.padEnd(22)} ${want}`)
  }
  local.close()
}

function main() {
  const db = new DatabaseSync(DB, { readOnly: true })
  const semesters = db
    .prepare(`SELECT sem FROM semesters ORDER BY sort_key`)
    .all()
    .map((r) => r.sem)

  console.log(`Verifying ${semesters.length} semesters against src/data/api ...`)
  for (const sem of semesters) {
    const before = failures
    verifySemester(db, sem)
    process.stdout.write(
      `  ${failures === before ? "ok  " : "FAIL"} ${sem}\n`
    )
  }
  db.close()

  if (process.argv.includes("--remote")) verifyRemoteSpotCheck()

  console.log(
    failures === 0
      ? "\nPARITY OK — database reproduces every JSON file exactly."
      : `\nPARITY FAILED — ${failures} mismatch(es).`
  )
  process.exit(failures === 0 ? 0 : 1)
}

main()
