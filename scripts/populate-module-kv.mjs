/**
 * One-off data prep for the MODULE_DATA KV namespace (see wrangler.jsonc).
 *
 * Reads the existing whole-semester indexes/metadata files and splits them
 * into per-module KV bulk-upload files, so the historic snapshot route
 * (src/lib/server/edge/get-module-snapshot.ts) can fetch a single module's
 * slice instead of parsing the whole file. Doesn't touch the whole-semester
 * files themselves — the client timetable-builder hooks still fetch those
 * directly (src/hooks/use-season-indexes.ts etc).
 *
 * This script only *generates* the bulk-upload JSON; it doesn't write to KV
 * itself (no Cloudflare credentials in this environment). Run it, then feed
 * the output to wrangler:
 *
 *   node scripts/populate-module-kv.mjs
 *   npx wrangler kv bulk put .kv-bulk/metadata-0.json --binding=MODULE_DATA --remote
 *   npx wrangler kv bulk put .kv-bulk/indexes-0.json  --binding=MODULE_DATA --remote
 *   ...(one command per printed file)
 *
 * Re-run whenever src/data/api/{metadata,indexes} changes (i.e. after the
 * scraper produces a new semester) to keep KV in sync.
 */

import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const SRC_DATA = path.join(ROOT, "src/data/api")
const OUT_DIR = path.join(ROOT, ".kv-bulk")

// Cloudflare's bulk API caps a single upload at 10,000 pairs.
const CHUNK_SIZE = 10_000

async function splitFile(kvPrefix, dir) {
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"))
  const entries = []

  for (const file of files) {
    const yearSem = file.replace(/\.json$/, "")
    const raw = await fs.readFile(path.join(dir, file), "utf-8")
    const parsed = JSON.parse(raw)

    for (const [code, moduleValue] of Object.entries(parsed)) {
      entries.push({
        key: `${kvPrefix}:${yearSem}:${code}`,
        value: JSON.stringify(moduleValue)
      })
    }
  }

  return entries
}

async function writeChunks(kvPrefix, entries) {
  await fs.mkdir(OUT_DIR, { recursive: true })
  const chunkFiles = []

  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE)
    const filename = path.join(OUT_DIR, `${kvPrefix}-${i / CHUNK_SIZE}.json`)
    await fs.writeFile(filename, JSON.stringify(chunk))
    chunkFiles.push(filename)
  }

  return chunkFiles
}

async function main() {
  const [metadataEntries, indexesEntries] = await Promise.all([
    splitFile("metadata", path.join(SRC_DATA, "metadata")),
    splitFile("indexes", path.join(SRC_DATA, "indexes"))
  ])

  const metadataFiles = await writeChunks("metadata", metadataEntries)
  const indexesFiles = await writeChunks("indexes", indexesEntries)

  console.log(
    `Prepared ${metadataEntries.length} metadata entries -> ${metadataFiles.length} file(s)`
  )
  console.log(
    `Prepared ${indexesEntries.length} indexes entries -> ${indexesFiles.length} file(s)`
  )
  console.log("\nRun these to upload (requires `wrangler login` first):\n")
  for (const f of [...metadataFiles, ...indexesFiles]) {
    console.log(
      `npx wrangler kv bulk put ${path.relative(ROOT, f)} --binding=MODULE_DATA --remote`
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
