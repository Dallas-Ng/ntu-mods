/**
 * Emit a .sql file for `wrangler d1 execute --file`, from the local SQLite
 * build. Uses multi-row INSERT ... VALUES batches, which are far more compact
 * and far fewer statements than sqlite3's one-INSERT-per-row `.dump`.
 *
 *   node scripts/db/dump-sql.mjs                     # whole database
 *   node scripts/db/dump-sql.mjs --sem 2025_2        # one semester (all scopes)
 *   node scripts/db/dump-sql.mjs --sem 2025_2 --scope courses
 *
 * A scoped dump is wrapped in DELETE ... WHERE sem = ? for exactly the tables
 * that scope owns, so re-running it is a replace, not an append. Replace rather
 * than upsert is deliberate: upsert cannot express deletion, so a cancelled
 * class index would linger as a phantom class forever.
 */

import fs from "fs"
import path from "path"
import { DatabaseSync } from "node:sqlite"

import { ROOT } from "./derive.mjs"

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : fallback
}

const DB = path.join(ROOT, arg("db", "db/ntu-mods.sqlite"))
const SEM = arg("sem", null)
const SCOPE = arg("scope", null)
const OUT = path.join(
  ROOT,
  arg("out", SEM ? `db/out/${SEM}${SCOPE ? `_${SCOPE}` : ""}.sql` : "db/out/full.sql")
)
/**
 * Batching is bounded by BYTES, not rows. D1 enforces SQLite's per-statement
 * length limit, and a fixed row count blows past it on wide rows: 500 offerings
 * rows (each carrying a full course description) produced a single INSERT that
 * failed with `statement too long: SQLITE_TOOBIG`. 128 KB is comfortably under
 * the limit while still keeping the statement count low.
 */
const MAX_STMT_BYTES = Number(arg("max-stmt-bytes", 128 * 1024))
/** Hard row cap per statement, applied on top of the byte budget. */
const MAX_STMT_ROWS = Number(arg("max-stmt-rows", 500))

const SCOPES = {
  courses: [
    "offerings",
    "offering_programmes",
    "class_indexes",
    "class_slots",
    "prerequisites",
  ],
  exams: ["exams"],
}

/** Tables that are not semester-scoped and are only emitted in a full dump. */
const GLOBAL_TABLES = ["semesters", "programmes"]

function lit(v) {
  if (v === null || v === undefined) return "NULL"
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL"
  if (typeof v === "bigint") return String(v)
  const s = String(v)
  // A raw newline or other control character survives SQLite fine inside a
  // string literal, but breaks any consumer that splits the file on statement
  // boundaries. Encode those values as a hex blob cast instead.
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) < 0x20) {
      return `CAST(x'${Buffer.from(s, "utf8").toString("hex")}' AS TEXT)`
    }
  }
  return `'${s.replaceAll("'", "''")}'`
}

function* dumpTable(db, table, where, params) {
  const cols = db
    .prepare(`SELECT name FROM pragma_table_info(?)`)
    .all(table)
    .map((r) => r.name)
  const colList = cols.map((c) => `"${c}"`).join(", ")
  const rows = db
    .prepare(`SELECT ${colList} FROM "${table}" ${where}`)
    .all(...params)

  const header = `INSERT INTO "${table}" (${colList}) VALUES\n`
  let batch = []
  let bytes = header.length

  for (const row of rows) {
    const tuple = `(${cols.map((c) => lit(row[c])).join(",")})`
    if (
      batch.length > 0 &&
      (bytes + tuple.length > MAX_STMT_BYTES || batch.length >= MAX_STMT_ROWS)
    ) {
      yield `${header}${batch.join(",\n")};\n`
      batch = []
      bytes = header.length
    }
    batch.push(tuple)
    bytes += tuple.length + 2
  }
  if (batch.length > 0) yield `${header}${batch.join(",\n")};\n`
}

function main() {
  const db = new DatabaseSync(DB, { readOnly: true })
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  const out = fs.createWriteStream(OUT)

  const scopes = SCOPE ? [SCOPE] : Object.keys(SCOPES)
  for (const s of scopes) {
    if (!SCOPES[s]) throw new Error(`Unknown scope: ${s}`)
  }

  const tables = SEM
    ? scopes.flatMap((s) => SCOPES[s])
    : [...GLOBAL_TABLES, ...scopes.flatMap((s) => SCOPES[s]), "loads"]

  if (SEM) {
    // Replace semantics, scoped. `loads` is rewritten for the same scope keys.
    for (const t of tables) out.write(`DELETE FROM "${t}" WHERE sem = ${lit(SEM)};\n`)
    for (const s of scopes) {
      out.write(
        `DELETE FROM "loads" WHERE sem = ${lit(SEM)} AND scope = ${lit(s)};\n`
      )
    }
  }

  const where = SEM ? "WHERE sem = ?" : ""
  const params = SEM ? [SEM] : []
  const counts = {}

  for (const table of tables) {
    const scoped = !GLOBAL_TABLES.includes(table)
    for (const stmt of dumpTable(
      db,
      table,
      scoped ? where : "",
      scoped ? params : []
    )) {
      out.write(stmt)
    }
    counts[table] = db
      .prepare(
        `SELECT COUNT(*) AS n FROM "${table}" ${scoped ? where : ""}`
      )
      .get(...(scoped ? params : [])).n
  }

  if (SEM) {
    for (const s of scopes) {
      for (const stmt of dumpTable(
        db,
        "loads",
        "WHERE sem = ? AND scope = ?",
        [SEM, s]
      )) {
        out.write(stmt)
      }
    }
  }

  out.end()
  db.close()

  out.on("close", () => {
    const bytes = fs.statSync(OUT).size
    console.log(OUT)
    for (const [t, n] of Object.entries(counts)) {
      console.log(`  ${t.padEnd(22)} ${n}`)
    }
    console.log(`  ${"bytes".padEnd(22)} ${(bytes / 1e6).toFixed(1)} MB`)
  })
}

main()
