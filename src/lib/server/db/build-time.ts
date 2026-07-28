/**
 * Build-time database access.
 *
 * IMPORTANT: this module imports `node:sqlite` and must never be reachable from
 * an on-demand (prerender = false) route — Cloudflare Workers cannot load it.
 * Request-time reads go through the D1 binding instead
 * (src/lib/server/edge/*). Both query the same schema with the same SQL from
 * ./queries.ts; only the driver differs.
 *
 * Why a local file rather than querying D1 over HTTP at build time: /mods/:code
 * prerenders 4,317 pages, and proxying each page's queries over the network
 * would add thousands of round trips to every build. The build downloads the
 * database once (`yarn db:pull`) and reads it locally — one SQLite file, two
 * runtimes.
 */

import fs from "fs"
import path from "path"
import { DatabaseSync } from "node:sqlite"

const DB_PATH = process.env.NTU_MODS_DB
  ? path.resolve(process.env.NTU_MODS_DB)
  : path.join(process.cwd(), "db/ntu-mods.sqlite")

let db: DatabaseSync | null = null

function open(): DatabaseSync {
  if (db) return db
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(
      `Module database not found at ${DB_PATH}.\n` +
        `Run \`yarn db:pull\` to download it from D1, or \`yarn db:build\` to ` +
        `rebuild it from src/data/api. Set NTU_MODS_DB to override the path.`
    )
  }
  db = new DatabaseSync(DB_PATH, { readOnly: true })
  return db
}

export function query<T>(sql: string, ...params: unknown[]): T[] {
  return open()
    .prepare(sql)
    .all(...(params as never[])) as T[]
}

export function queryOne<T>(sql: string, ...params: unknown[]): T | null {
  return (query<T>(sql, ...params)[0] as T | undefined) ?? null
}

export function closeDb(): void {
  db?.close()
  db = null
}
