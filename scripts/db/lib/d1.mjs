/**
 * Thin wrapper around `wrangler d1 execute --json`.
 *
 * Wrangler prints a human banner before the JSON payload and warnings after it,
 * so the raw stdout is not parseable as JSON. This finds the payload and
 * returns just the result rows.
 *
 *   node scripts/db/d1.mjs "SELECT COUNT(*) FROM offerings"
 *   node scripts/db/d1.mjs --local "SELECT 1"
 */

import { execFileSync } from "child_process"

export function d1Query(sql, { database = "ntu-mods-dev", local = false } = {}) {
  const out = execFileSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      database,
      local ? "--local" : "--remote",
      "--yes",
      "--json",
      "--command",
      sql,
    ],
    { encoding: "utf-8", maxBuffer: 256 * 1024 * 1024 }
  )

  const start = out.indexOf("[")
  if (start === -1) throw new Error(`No JSON payload in wrangler output:\n${out}`)
  // Warnings can follow the payload, so decode incrementally rather than
  // assuming the payload runs to end-of-output.
  for (let end = out.lastIndexOf("]"); end > start; end = out.lastIndexOf("]", end - 1)) {
    try {
      return JSON.parse(out.slice(start, end + 1)).flatMap((r) => r.results ?? [])
    } catch {
      /* keep shrinking */
    }
  }
  throw new Error(`Could not parse wrangler JSON payload:\n${out.slice(start)}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const local = process.argv.includes("--local")
  const sql = process.argv.filter((a) => !a.startsWith("--")).at(-1)
  console.log(JSON.stringify(d1Query(sql, { local }), null, 2))
}
