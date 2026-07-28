/**
 * Download D1 into the local SQLite file the build reads.
 *
 * D1 is the source of truth; this file is a derived read replica, rebuilt
 * before each build. `wrangler d1 export` emits SQL rather than a SQLite file
 * (there is no binary export), so this replays it through `node:sqlite`.
 *
 *   node scripts/db/pull-db.mjs [--database ntu-mods-dev] [--out db/ntu-mods.sqlite]
 */

import { execFileSync } from "child_process"
import fs from "fs"
import path from "path"
import { DatabaseSync } from "node:sqlite"

import { ROOT } from "./derive.mjs"

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : fallback
}

const DATABASE = arg("database", process.env.NTU_MODS_D1 ?? "ntu-mods-dev")
const OUT = path.join(ROOT, arg("out", "db/ntu-mods.sqlite"))
const DUMP = path.join(ROOT, "db/out/export.sql")

function main() {
  fs.mkdirSync(path.dirname(DUMP), { recursive: true })
  console.log(`Exporting ${DATABASE} ...`)
  execFileSync(
    "npx",
    [
      "wrangler",
      "d1",
      "export",
      DATABASE,
      "--remote",
      "--output",
      DUMP,
    ],
    { stdio: "inherit" }
  )

  const sql = fs.readFileSync(DUMP, "utf-8")

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

main()
