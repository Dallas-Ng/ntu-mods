/**
 * Emit a whole-database .sql file for `wrangler d1 execute --file`, from the
 * local SQLite build. Uses multi-row INSERT ... VALUES batches, which are far
 * more compact and far fewer statements than sqlite3's one-INSERT-per-row
 * `.dump`.
 *
 * Whole-database only. Reseeding every table from a fresh export is a cold
 * start; scripts/db/load-semester.mjs already handles the routine case (one
 * semester, one scope) with its own delete+insert transaction, shrink guard,
 * and dry-run.
 *
 *   node scripts/db/reseed-d1.mjs
 */

import fs from "fs"
import path from "path"
import { DatabaseSync } from "node:sqlite"

import { ROOT } from "./lib/derive.mjs"
import { insertStatements } from "./lib/sql-batch.mjs"

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : fallback
}

const DB = path.join(ROOT, arg("db", "db/ntu-mods.sqlite"))
const OUT = path.join(ROOT, arg("out", "db/out/full.sql"))
/** See lib/sql-batch.mjs — batching is bounded by bytes, not row count. */
const MAX_STMT_BYTES = Number(arg("max-stmt-bytes", 128 * 1024))
const MAX_STMT_ROWS = Number(arg("max-stmt-rows", 500))

const TABLES = [
  "semesters",
  "programmes",
  "offerings",
  "offering_programmes",
  "class_indexes",
  "class_slots",
  "prerequisites",
  "exams",
  "loads"
]

function main() {
  const db = new DatabaseSync(DB, { readOnly: true })
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  const out = fs.createWriteStream(OUT)

  const counts = {}
  for (const table of TABLES) {
    for (const stmt of insertStatements(db, table, "", [], {
      maxBytes: MAX_STMT_BYTES,
      maxRows: MAX_STMT_ROWS
    })) {
      out.write(stmt)
    }
    counts[table] = db.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get().n
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
