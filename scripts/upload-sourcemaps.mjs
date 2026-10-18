import { execFileSync, spawnSync } from "child_process"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

// Runs after `astro build`. The client bundles are built with hidden source
// maps (astro.config.mjs); this uploads them to PostHog so error tracking
// shows real file names and lines instead of vendor.*.js, then deletes them
// so they are never deployed. Without credentials (local builds, forks,
// previews without the variables) it only deletes them.
//
// Credentials are Workers Builds variables:
//   POSTHOG_CLI_API_KEY     personal API key, scopes: error tracking write,
//                           organization read
//   POSTHOG_CLI_PROJECT_ID  the PostHog project ID
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const CLIENT_DIR = path.join(ROOT, "dist", "client")
const ASSETS_DIR = path.join(CLIENT_DIR, "_astro")

async function deleteMaps() {
  const files = await fs.readdir(CLIENT_DIR, { recursive: true })
  const maps = files.filter((f) => f.endsWith(".map"))
  await Promise.all(maps.map((f) => fs.rm(path.join(CLIENT_DIR, f))))
  return maps.length
}

function releaseVersion() {
  if (process.env.WORKERS_CI_COMMIT_SHA)
    return process.env.WORKERS_CI_COMMIT_SHA
  try {
    return execFileSync("git", ["rev-parse", "HEAD"]).toString().trim()
  } catch {
    return undefined
  }
}

if (process.env.POSTHOG_CLI_API_KEY && process.env.POSTHOG_CLI_PROJECT_ID) {
  const version = releaseVersion()
  // symbol-set mode keeps release IDs out of the bundles: injecting them
  // would change a content-hashed file's bytes from one deploy to the next
  // while its name (and its year-long immutable cache entry) stays the same.
  const args = [
    "--host",
    "https://us.posthog.com",
    "sourcemap",
    "process",
    "--directory",
    ASSETS_DIR,
    "--release-name",
    "ntu-mods",
    "--release-mode",
    "symbol-set",
    "--delete-after",
    ...(version ? ["--release-version", version] : [])
  ]
  const result = spawnSync(
    path.join(ROOT, "node_modules", ".bin", "posthog-cli"),
    args,
    { stdio: "inherit" }
  )
  // A failed upload costs readable stack traces for this deploy, not the
  // deploy itself, so it doesn't fail the build.
  if (result.status !== 0) {
    console.warn(
      "[sourcemaps] Upload to PostHog failed; deploying without source maps"
    )
  }
} else {
  console.log(
    "[sourcemaps] Skipping upload: POSTHOG_CLI_API_KEY / POSTHOG_CLI_PROJECT_ID not set"
  )
}

// --delete-after removes the maps it uploaded; this catches the rest (no
// credentials, a failed upload, a chunk the CLI didn't pair).
const left = await deleteMaps()
if (left) console.log(`[sourcemaps] Deleted ${left} source map(s) from dist`)
