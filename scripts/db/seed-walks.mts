/**
 * Seeds the `walks` D1 table with the routes students are most likely to ask
 * for, so the first request for them is already a hit. Anything not seeded is
 * routed on demand by /api/walk and saved then.
 *
 * A pair is two venues with back-to-back classes in the same semester (the
 * second starts within an hour of the first ending); pairs are ranked by how
 * many classes sit at each end, and the top --limit are routed.
 *
 *   npx tsx scripts/db/seed-walks.mts [--sem 2026_1] [--limit 3000] [--workers 6]
 *
 * MazeMap is a public service: --workers parallel calls, each pausing 250 ms,
 * so keep it modest.
 * Routes are appended to db/out/walks.jsonl as they arrive, so an interrupted
 * run resumes where it stopped. It then writes db/out/walks.sql; apply with
 *   npx wrangler d1 execute DB --local  --file db/out/walks.sql
 *   npx wrangler d1 execute DB --remote --file db/out/walks.sql
 */

import fs from "fs"
import path from "path"

import {
  buildWalk,
  ROUTE_CACHE_VERSION,
  sortPair,
  UPSTREAM,
  upstreamQuery,
  type Feature,
  type RoutePoint
} from "../../src/lib/walk-route.ts"

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}

const root = path.resolve(import.meta.dirname, "../..")
const indexes = path.join(root, "src/data/api/indexes")
const sem =
  arg("sem", "") ||
  fs
    .readdirSync(indexes)
    .map((f) => f.replace(".json", ""))
    .sort()
    .at(-1)!
const limit = Number(arg("limit", "3000"))

interface Venue extends RoutePoint {
  slots: number
}
const venues: Record<string, Venue> = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/venues/venues.json"), "utf8")
).venues
const timetable: Record<
  string,
  Record<string, { day: number; time: string; venue: string }[]>
> = JSON.parse(fs.readFileSync(path.join(indexes, `${sem}.json`), "utf8"))

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(2, 4))

// Classes per (day, venue, start, end): how many sit in each slot.
const slots = new Map<string, number>()
for (const idx of Object.values(timetable))
  for (const list of Object.values(idx))
    for (const s of list) {
      if (!s.time || !s.venue) continue
      const [a, b] = s.time.split("-")
      const k = `${s.day}|${s.venue.trim()}|${toMin(a)}|${toMin(b)}`
      slots.set(k, (slots.get(k) ?? 0) + 1)
    }
const byDay = new Map<
  number,
  { v: string; a: number; b: number; n: number }[]
>()
for (const [k, n] of slots) {
  const [d, v, a, b] = k.split("|")
  if (!venues[v]) continue
  const arr = byDay.get(Number(d)) ?? []
  arr.push({ v, a: Number(a), b: Number(b), n })
  byDay.set(Number(d), arr)
}

// Back-to-back: the next class starts 0-60 minutes after the first one ends.
const weight = new Map<
  string,
  { s: RoutePoint; t: RoutePoint; key: string; w: number }
>()
for (const list of byDay.values())
  for (const x of list)
    for (const y of list) {
      if (y.a < x.b || y.a > x.b + 60 || x.v === y.v) continue
      const { s, t, key } = sortPair(venues[x.v], venues[y.v])
      if (key.split(">")[0] === key.split(">")[1]) continue
      const cur = weight.get(key) ?? { s, t, key, w: 0 }
      cur.w += x.n * y.n
      weight.set(key, cur)
    }
const wanted = [...weight.values()].sort((p, q) => q.w - p.w).slice(0, limit)
console.log(`${sem}: ${weight.size} pairs, routing the top ${wanted.length}`)

// Resume from what is already on disk.
const out = path.join(root, "db/out")
fs.mkdirSync(out, { recursive: true })
const jsonl = path.join(out, "walks.jsonl")
const done = new Map<string, string>()
if (fs.existsSync(jsonl))
  for (const line of fs
    .readFileSync(jsonl, "utf8")
    .split("\n")
    .filter(Boolean)) {
    const { key, v, route } = JSON.parse(line)
    if (v === ROUTE_CACHE_VERSION) done.set(key, route)
  }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
let fetched = 0
let failed = 0
const todo = wanted.filter((p) => !done.has(p.key))
const route = async (p: (typeof wanted)[number]) => {
  try {
    const res = await fetch(`${UPSTREAM}?${upstreamQuery(p.s, p.t)}`, {
      signal: AbortSignal.timeout(8000)
    })
    const features: Feature[] = res.ok
      ? ((await res.json()).path?.features ?? [])
      : []
    if (!features.length) throw new Error(`no route (${res.status})`)
    const route = JSON.stringify(buildWalk(features))
    fs.appendFileSync(
      jsonl,
      JSON.stringify({ key: p.key, v: ROUTE_CACHE_VERSION, route }) + "\n"
    )
    done.set(p.key, route)
    if (++fetched % 100 === 0) console.log(`  ${fetched} routed`)
  } catch (e) {
    failed++
    console.warn(`  skip ${p.key}: ${(e as Error).message}`)
  }
}
// A few at a time: a call takes ~2 s, so one at a time would take hours.
const workers = Number(arg("workers", "6"))
let next = 0
await Promise.all(
  Array.from({ length: workers }, async () => {
    while (next < todo.length) {
      await route(todo[next++])
      await sleep(250)
    }
  })
)

const q = (s: string) => `'${s.replaceAll("'", "''")}'`
const sql = wanted
  .filter((p) => done.has(p.key))
  .map(
    (p) =>
      `INSERT OR REPLACE INTO walks (key, v, route) VALUES (${q(p.key)}, ${q(ROUTE_CACHE_VERSION)}, ${q(done.get(p.key)!)});`
  )
fs.writeFileSync(path.join(out, "walks.sql"), sql.join("\n") + "\n")
console.log(
  `Done: ${fetched} new, ${failed} failed, ${sql.length} in db/out/walks.sql`
)
