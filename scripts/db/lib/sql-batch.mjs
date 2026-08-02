/**
 * SQL literal encoding and byte-bounded INSERT batching, shared by
 * reseed-d1.mjs (whole-database dump) and load-semester.mjs (per-semester
 * load) — both emit `.sql` files for `wrangler d1 execute --file`.
 *
 * Batches are bounded by BYTES, not row count. A fixed row cap blows past
 * SQLite/D1's per-statement length limit on wide rows: 500 `offerings` rows
 * (each carrying a full course description) produced a single INSERT that
 * failed with `statement too long: SQLITE_TOOBIG`.
 */

export function sqlLiteral(v) {
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

export function* insertStatements(
  db,
  table,
  where,
  params,
  { maxBytes = 90_000, maxRows = 500 } = {}
) {
  const cols = db
    .prepare(`SELECT name FROM pragma_table_info(?)`)
    .all(table)
    .map((r) => r.name)
  const colList = cols.map((c) => `"${c}"`).join(", ")
  const header = `INSERT INTO "${table}" (${colList}) VALUES\n`
  const rows = db
    .prepare(`SELECT ${colList} FROM "${table}" ${where}`)
    .all(...params)

  let batch = []
  let bytes = header.length
  for (const row of rows) {
    const tuple = `(${cols.map((c) => sqlLiteral(row[c])).join(",")})`
    if (
      batch.length > 0 &&
      (bytes + tuple.length > maxBytes || batch.length >= maxRows)
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
