/**
 * Writes one (semester, scope) into a SQLite database, with replace semantics.
 *
 * Shared by the whole-corpus bootstrap (build-db.mjs) and the per-semester
 * pipeline loader (load-semester.mjs) so there is exactly one implementation of
 * "what a semester looks like as rows". The bootstrap is parity-verified
 * against every JSON file by verify-parity.mjs, so the pipeline inherits that
 * guarantee rather than reimplementing it.
 *
 * Replace, not upsert. Upsert cannot express deletion: if NTU cancels index
 * 10001, an upsert leaves the row in place and students see a phantom class
 * forever. Replace also keeps the property that a semester in the database is
 * exactly what NTU published at scrape time, rather than a sediment of every
 * scrape ever run.
 */

import crypto from "crypto"

import {
  MODULE_CODE_RE,
  deriveCategories,
  deriveFaculty,
  parseSem,
  parseTimeRange,
  programmeFaculty,
  programmeIsCore,
  semesterName,
} from "./derive.mjs"

/** Tables each scope owns. Re-running `courses` must not delete `exams`. */
export const SCOPE_TABLES = {
  courses: [
    "offerings",
    "offering_programmes",
    "class_indexes",
    "class_slots",
    "prerequisites",
  ],
  exams: ["exams"],
}

export const hashOf = (value) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)

function prepareAll(db) {
  return {
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
    programmeId: db.prepare(`SELECT id FROM programmes WHERE key = ?`),
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
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(sem, scope) DO UPDATE SET
         loaded_at = excluded.loaded_at,
         source_hash = excluded.source_hash,
         row_counts = excluded.row_counts`
    ),
  }
}

/** The semesters catalogue is the one table where upsert is right: NTU does not un-publish past terms. */
export function upsertSemester(db, sem, name) {
  const s = parseSem(sem)
  db.prepare(
    `INSERT INTO semesters (sem, code, year, semester, name, sort_key)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(sem) DO UPDATE SET code = excluded.code, name = excluded.name,
       year = excluded.year, semester = excluded.semester, sort_key = excluded.sort_key`
  ).run(
    s.sem,
    s.code,
    s.year,
    s.semester,
    name ?? semesterName(s.year, s.semester),
    s.sortKey
  )
}

export function deleteScope(db, sem, scope) {
  for (const table of SCOPE_TABLES[scope]) {
    db.prepare(`DELETE FROM "${table}" WHERE sem = ?`).run(sem)
  }
}

/**
 * @param conflicts optional array; cross-programme field disagreements are
 * pushed here instead of being silently resolved first-wins.
 */
export function writeCourses(db, sem, { metadata, indexes }, { stmts, conflicts } = {}) {
  const s = stmts ?? prepareAll(db)
  const counts = {
    offerings: 0,
    offering_programmes: 0,
    class_indexes: 0,
    class_slots: 0,
    prerequisites: 0,
  }

  const programmeIds = new Map()
  const programmeId = (key) => {
    let id = programmeIds.get(key)
    if (id !== undefined) return id
    s.programme.run(key, programmeFaculty(key), programmeIsCore(key))
    id = s.programmeId.get(key).id
    programmeIds.set(key, id)
    return id
  }

  for (const [code, m] of Object.entries(metadata)) {
    const searchKeys = m.searchKeys ?? []
    s.offering.run(
      code,
      sem,
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
      s.offProg.run(code, sem, programmeId(key), seq)
      counts.offering_programmes++
    })

    const groups = Array.isArray(m.prerequisite) ? m.prerequisite : []
    groups.forEach((group, groupNo) => {
      group.forEach((item, itemNo) => {
        const text = String(item)
        s.prereq.run(
          code,
          sem,
          groupNo,
          itemNo,
          MODULE_CODE_RE.test(text) ? text : null,
          text
        )
        counts.prerequisites++
      })
    })
  }

  for (const [code, byKey] of Object.entries(indexes)) {
    if (conflicts && !(code in metadata)) {
      conflicts.push(`${sem} ${code}: has class indexes but no metadata entry`)
      continue
    }
    for (const [indexKey, slots] of Object.entries(byKey)) {
      s.classIndex.run(code, sem, indexKey)
      counts.class_indexes++
      slots.forEach((slot, slotNo) => {
        const { startMin, endMin } = parseTimeRange(slot.time)
        s.slot.run(
          code,
          sem,
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

  return counts
}

export function writeExams(db, sem, exams, { stmts } = {}) {
  const s = stmts ?? prepareAll(db)
  let n = 0
  for (const [code, e] of Object.entries(exams)) {
    s.exam.run(
      code,
      sem,
      e.date ?? null,
      e.day ?? null,
      e.start_time ?? null,
      e.end_time ?? null,
      e.name ?? null,
      e.duration ?? null
    )
    n++
  }
  return { exams: n }
}

export function recordLoad(db, sem, scope, counts, sourceHash, loadedAt, { stmts } = {}) {
  const s = stmts ?? prepareAll(db)
  s.load.run(sem, scope, loadedAt, sourceHash, JSON.stringify(counts))
}

export { prepareAll }
