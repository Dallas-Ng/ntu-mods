import { spawnSync } from "node:child_process"
import fs from "node:fs/promises"

const KEY = "59b2d3cb6fb844b8b9d417ea7c92c380"
const HOST = "ntumods.com"
const SITE = `https://${HOST}`
const ENDPOINT = "https://api.indexnow.org/IndexNow"
const MANIFEST = "indexnow-manifest.json"
const BATCH_SIZE = 100

async function readLiveManifest() {
  const response = await fetch(`${SITE}/${MANIFEST}?v=${Date.now()}`, {
    signal: AbortSignal.timeout(10_000)
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`)
  return response.text()
}

function parseManifest(raw) {
  const routes = Object.entries(JSON.parse(raw))
  if (
    routes.length === 0 ||
    !routes.every(([route, hash]) =>
      /^\/(?!\/)[a-z0-9/._-]*$/i.test(route) &&
      (hash === null || (typeof hash === "string" && /^[a-f0-9]{64}$/.test(hash)))
    )
  ) {
    throw new Error("Invalid IndexNow manifest")
  }
  return new Map(routes)
}

const local = await fs.readFile(`dist/client/${MANIFEST}`, "utf8")
const current = parseManifest(local)
let previous
try {
  const live = await readLiveManifest()
  if (live !== null) previous = parseManifest(live)
} catch (error) {
  console.warn("[IndexNow] Could not read live baseline:", error.message)
}

const deploy = spawnSync(
  "pnpm",
  ["exec", "wrangler", "deploy", "--config", "dist/server/wrangler.json"],
  { stdio: "inherit" }
)
if (deploy.error) throw deploy.error
if (deploy.status !== 0) process.exit(deploy.status ?? 1)

if (!previous) {
  console.log("[IndexNow] No live baseline. Skipping submission.")
  process.exit(0)
}

try {
  if ((await readLiveManifest()) !== local) {
    throw new Error("The deployed manifest is not live yet")
  }

  const changed = [...current]
    .filter(([route, hash]) => !previous.has(route) || previous.get(route) !== hash)
    .map(([route]) => route)
  const dropped = [...previous.keys()].filter((route) => !current.has(route))
  for (let i = 0; i < dropped.length; i += 20) {
    // Older modules can leave the sitemap while their pages still resolve.
    await Promise.all(dropped.slice(i, i + 20).map(async (route) => {
      try {
        const response = await fetch(`${SITE}${route}`, {
          method: "HEAD",
          redirect: "manual",
          signal: AbortSignal.timeout(5_000)
        })
        if ([301, 302, 307, 308, 404, 410].includes(response.status)) changed.push(route)
      } catch (error) {
        console.warn(`[IndexNow] Could not check ${route}:`, error.message)
      }
    }))
  }

  console.log(`[IndexNow] ${changed.length} changed URLs`)
  for (let i = 0; i < changed.length; i += BATCH_SIZE) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: `${SITE}/${KEY}.txt`,
        urlList: changed.slice(i, i + BATCH_SIZE).map((route) =>
          new URL(route, SITE).href
        )
      }),
      signal: AbortSignal.timeout(10_000)
    })
    if (!response.ok) throw new Error(`Submission HTTP ${response.status}`)
    console.log(`[IndexNow] Accepted (${response.status})`)
  }
} catch (error) {
  console.warn("[IndexNow]", error.message)
}
