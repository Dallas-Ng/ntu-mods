/**
 * Prebuild: generate the static data files the client fetches, directly from
 * src/data/api rather than from a compiled SQLite copy of it.
 *
 * Requests to static assets are free and unmetered on Workers, and the
 * timetable generator genuinely needs a whole semester's index set in the
 * browser at once — so these stay bulk static artifacts.
 *
 * Emitted (all consumed by client code — see the fetch call sites named below):
 *   public/data/api/indexes/{sem}.json   use-season-indexes.ts
 *   public/data/api/exams/{sem}.json     use-season-exams.ts, timetable-overview.tsx
 *   public/data/api/modules.json         use-all-modules.ts
 *   public/data/api/random-samples.json  settings/table-settings.tsx
 *   src/data/api/semesters.json          bundled by src/lib/semesters.ts and exams/index.astro
 *
 * indexes/{sem}.json and exams/{sem}.json aren't reshaped, only
 * re-serialized: the raw src/data/api files are already in the exact shape
 * the client fetches (they predate this whole data layer), but they're
 * space-formatted (Python's json.dump default) and these are fetched by the
 * client, so writing them back out through JSON.stringify to minify is worth
 * the read. Every semester with a metadata file is included, even 2014_S,
 * whose metadata file is empty (0 modules) — this loop runs on file
 * existence, not on having offerings.
 */

import fs from "fs/promises"
import fsSync from "fs"
import path from "path"

import { hasWeek1Start } from "../src/config/semester-calendar.ts"
import * as json from "../src/lib/server/db/json-source.ts"

const ROOT = path.join(import.meta.dirname, "..")
const SRC_DATA = path.join(ROOT, "src/data/api")
const PUBLIC_DATA = path.join(ROOT, "public/data/api")

const write = (p: string, value: unknown) => fs.writeFile(p, JSON.stringify(value))

/**
 * One entry per module code, taken from its most recent offering — the
 * payload behind /mods and the module search.
 *
 * Exactly the AllModule shape in src/types/mods.ts and nothing more. It used
 * to carry the whole metadata record: every restriction field, the
 * description, the prerequisite nesting, and the raw `searchKeys` programme
 * codes, none of which the list view reads. searchKeys in particular was
 * shipped to the browser only to be re-parsed on every card render and every
 * filter pass to work out faculty and category — both are computed once here
 * instead.
 *
 * The full record is still available per module: prerendered into the page
 * by getModuleMetadata, or queried from D1 by the snapshot route.
 */
function buildModules(latestSem: string) {
  // The two newest regular semesters with data: the ones the planner and
  // /mods can switch between (mirrors SELECTABLE_SEMESTERS in src/lib/semesters.ts).
  const selectable = json
    .semestersWithOfferings()
    .filter((s) => s.semester !== "S" && s.semester !== "T")
    .slice(0, 2)
    .map((s) => s.sem)

  const modules = json.latestOfferings().map((o) => {
    const offeredSems = new Set(json.getModuleSemesters(o.code).map((s) => s.sem))
    const searchKeys = o.raw.searchKeys ?? []
    const module: Record<string, unknown> = {
      code: o.code,
      title: o.raw.title,
      au: o.raw.au,
      faculty: json.deriveFaculty(searchKeys) || "",
      categories: json.deriveCategories(searchKeys),
      latestYear: o.year,
      latestSemester: o.semester,
      isCurrentSemester: o.sem === latestSem,
      semesters: selectable
        .filter((sem) => offeredSems.has(sem))
        .map((sem) => sem.replace("_", ";"))
    }
    if (o.raw.notAvailableToProgramme !== undefined) {
      module.notAvailableToProgramme = o.raw.notAvailableToProgramme
    }
    return module
  })

  return { modules }
}

/** 200 sampled modules with one real timetabled slot each, for the settings preview. */
function buildRandomSamples(latestSem: string) {
  const indexes = json.readIndexes(latestSem)
  const metadata = JSON.parse(
    fsSync.readFileSync(path.join(SRC_DATA, "metadata", `${latestSem}.json`), "utf-8")
  ) as Record<string, { title: string; au: string }>

  // Group by module, then pick one module at a time so a module with many
  // slots is not over-represented — matching the previous one-sample-per-module
  // behaviour.
  const byCode = new Map<string, Array<{ indexKey: string; slot: Index }>>()
  for (const code of Object.keys(indexes).sort()) {
    for (const indexKey of Object.keys(indexes[code]).sort()) {
      for (const slot of indexes[code][indexKey]) {
        if (slot.day == null || slot.day === 0) continue
        let list = byCode.get(code)
        if (!list) byCode.set(code, (list = []))
        list.push({ indexKey, slot })
      }
    }
  }

  const codes = [...byCode.keys()].sort(() => Math.random() - 0.5)
  const samples = []
  for (const code of codes) {
    if (samples.length >= 200) break
    const list = byCode.get(code)!
    const { indexKey, slot } = list[Math.floor(Math.random() * list.length)]
    const meta = metadata[code]
    samples.push({
      code,
      title: meta.title,
      au: meta.au,
      indexKey,
      index: slot
    })
  }
  return samples
}

/**
 * The semester catalogue, newest first, restricted to semesters that
 * actually have offerings.
 *
 * Names are carried forward from the currently committed semesters.json
 * (itself last written by this same function) rather than re-derived, so a
 * name never changes underneath a semester once set. Anything not already
 * named — a semester this file has never listed before — falls back to
 * json.semesterName().
 */
function buildSemesters() {
  const existing = JSON.parse(
    fsSync.readFileSync(path.join(SRC_DATA, "semesters.json"), "utf-8")
  ) as Array<{ code: string; name: string }>
  const namesBySem = new Map(
    existing.map((s) => [s.code.replace(";", "_"), s.name])
  )

  return json.semestersWithOfferings().map((s) => ({
    code: s.year + ";" + s.semester,
    name: namesBySem.get(s.sem) ?? json.semesterName(s.year, s.semester)
  }))
}

async function main() {
  console.log("Building static data from src/data/api...")

  const [latest] = json.semestersWithOfferings()
  if (!latest) throw new Error("No semester in src/data/api has any offerings")
  console.log(`  latest semester with data: ${latest.sem}`)
  if (!hasWeek1Start(`${latest.year};${latest.semester}`)) {
    throw new Error(
      `Latest semester ${latest.sem} has no Teaching Week 1 date: add it to src/config/semester-calendar.ts`
    )
  }

  const allSems = fsSync
    .readdirSync(path.join(SRC_DATA, "metadata"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))

  await fs.mkdir(path.join(PUBLIC_DATA, "indexes"), { recursive: true })
  await fs.mkdir(path.join(PUBLIC_DATA, "exams"), { recursive: true })

  for (const sem of allSems) {
    // Not a straight file copy: src/data/api is space-formatted (Python's
    // json.dump default), but the client fetches these, so re-serializing
    // through JSON.stringify to minify is worth the read.
    await write(path.join(PUBLIC_DATA, "indexes", `${sem}.json`), json.readIndexes(sem))
    await write(path.join(PUBLIC_DATA, "exams", `${sem}.json`), json.readExams(sem))
  }
  console.log(`  Wrote ${allSems.length} indexes/*.json and ${allSems.length} exams/*.json`)

  const modules = buildModules(latest.sem)
  await write(path.join(PUBLIC_DATA, "modules.json"), modules)
  console.log(`  Built modules.json (${modules.modules.length} modules)`)

  const samples = buildRandomSamples(latest.sem)
  await write(path.join(PUBLIC_DATA, "random-samples.json"), samples)
  console.log(`  Built random-samples.json (${samples.length} samples)`)

  const semesterList = buildSemesters()
  await write(path.join(SRC_DATA, "semesters.json"), semesterList)
  console.log(
    `  Built semesters.json (${semesterList.length} semesters, latest ${semesterList[0].code})`
  )

  console.log("Done.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
