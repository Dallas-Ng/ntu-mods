/**
 * Make sure db/ntu-mods.sqlite exists before a build or dev server starts.
 *
 * The build reads the database, not the JSON — but CI has no wrangler
 * credentials, so `wrangler d1 export` is not available there. Until the build
 * environment can authenticate to D1, this falls back to rebuilding the file
 * from the JSON still committed under src/data/api.
 *
 * That fallback is the only reason src/data/api is still in the repo. Once the
 * build can pull from D1 (an API token in the Workers Builds environment, or
 * the file staged in R2), this script becomes `yarn db:pull` and the JSON tree
 * can be deleted.
 *
 *   node scripts/db/ensure-db.mjs [--force]
 */

import { execFileSync } from "child_process"
import fs from "fs"
import path from "path"

import { ROOT } from "./derive.mjs"

const DB = process.env.NTU_MODS_DB
  ? path.resolve(process.env.NTU_MODS_DB)
  : path.join(ROOT, "db/ntu-mods.sqlite")

if (fs.existsSync(DB) && !process.argv.includes("--force")) {
  process.exit(0)
}

const jsonSource = path.join(ROOT, "src/data/api/metadata")
if (!fs.existsSync(jsonSource)) {
  console.error(
    `No database at ${DB} and no src/data/api to rebuild it from.\n` +
      `Run \`yarn db:pull\` to download it from D1.`
  )
  process.exit(1)
}

console.log(`No database at ${DB} — rebuilding from src/data/api ...`)
execFileSync("node", [path.join(ROOT, "scripts/db/build-db.mjs")], {
  stdio: "inherit",
})
