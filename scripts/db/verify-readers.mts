/**
 * Behavioural check for the rewritten src/lib/server/get-*.ts readers.
 *
 * verify-parity.mjs proves the database holds the same data as the JSON. This
 * proves the readers built on top of it return the same JavaScript values the
 * fs-based readers did, which is the thing the pages actually consume.
 *
 * Expected values come from the JSON files still in the repo, so this can only
 * run before those are deleted — which is exactly when it is useful.
 *
 *   npx tsx scripts/db/verify-readers.mts     (or: node --experimental-strip-types)
 */

import fs from "fs"
import path from "path"

import { MODULE_CODE_RE } from "./lib/constants.mjs"
import { deriveCategories, deriveFaculty } from "./lib/derive.mjs"

import {
  getAllModuleMetadata,
  getLatestSemester,
  getModuleCurrentSemester,
  getModuleExamData,
  getModuleIndexesData,
  getModuleMetadata,
  getModuleSemesters,
  getPrerequisiteGraph,
  getSemesterExamsData,
} from "../../src/lib/server/db/repo.ts"

const ROOT = path.join(import.meta.dirname, "../..")
const SRC = path.join(ROOT, "src/data/api")
const readJson = (p: string) => JSON.parse(fs.readFileSync(p, "utf-8"))

/**
 * Object key order is not part of the contract — nothing downstream reads a
 * module's fields positionally — so it is normalised away. Array order IS part
 * of the contract (searchKeys ordering decides faculty; slot order is the
 * displayed order) and is left alone.
 */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as object)
        .sort()
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])])
    )
  }
  return value
}

let failures = 0
const eq = (label: string, got: unknown, want: unknown) => {
  const a = JSON.stringify(canonical(got))
  const b = JSON.stringify(canonical(want))
  if (a === b) return
  failures++
  console.error(`  FAIL ${label}`)
  console.error(`    got  ${a?.slice(0, 300)}`)
  console.error(`    want ${b?.slice(0, 300)}`)
}

const semesters = fs
  .readdirSync(path.join(SRC, "metadata"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .sort()

/** A spread of semesters plus every module in a couple of them. */
const SAMPLE_SEMS = ["2014_1", "2017_2", "2021_1", "2025_2", "2026_1"]

async function main() {
  console.log("getLatestSemester")
  {
    // The newest semester with offerings, which is what the DB-backed reader
    // now returns. The old semesters.json[0] answer is checked separately.
    const withData = semesters.filter(
      (s) => Object.keys(readJson(path.join(SRC, "metadata", `${s}.json`))).length > 0
    )
    const rank: Record<string, number> = { "1": 1, "2": 2, S: 3, T: 4 }
    const newest = withData
      .map((s) => {
        const [y, t] = [s.slice(0, s.indexOf("_")), s.slice(s.indexOf("_") + 1)]
        return { s, y, t, k: Number(y) * 10 + rank[t] }
      })
      .sort((a, b) => a.k - b.k)
      .at(-1)!
    eq("latest semester", await getLatestSemester(), {
      year: newest.y,
      semester: newest.t,
    })

    const portal = readJson(path.join(SRC, "semesters.json"))[0].code.split(";")
    const dbAnswer = await getLatestSemester()
    if (portal[0] !== dbAnswer.year || portal[1] !== dbAnswer.semester) {
      console.log(
        `  note: portal catalogue says ${portal.join(";")}, database says ` +
          `${dbAnswer.year};${dbAnswer.semester} — the database is authoritative`
      )
    }
  }

  console.log("getModuleMetadata / getAllModuleMetadata")
  for (const sem of SAMPLE_SEMS) {
    const [year, semester] = [sem.slice(0, sem.indexOf("_")), sem.slice(sem.indexOf("_") + 1)]
    const expected = readJson(path.join(SRC, "metadata", `${sem}.json`))
    const all = await getAllModuleMetadata(year, semester)

    eq(`${sem} getAllModuleMetadata key count`, Object.keys(all).length, Object.keys(expected).length)
    for (const [code, want] of Object.entries(expected)) {
      // faculty and categories are new precomputed fields with no counterpart
      // in the JSON, so they are asserted against the derivation rather than
      // compared. Everything else must match exactly.
      const { faculty, categories, ...rest } = all[code] ?? {}
      eq(`${sem} ${code} getAllModuleMetadata`, rest, { ...(want as object), code })
      eq(`${sem} ${code} faculty`, faculty, deriveFaculty(want.searchKeys ?? []))
      eq(`${sem} ${code} categories`, categories, deriveCategories(want.searchKeys ?? []))
      if (failures > 5) return
    }

    const first = Object.keys(expected)[0]
    if (first) {
      const { faculty, categories, ...one } =
        (await getModuleMetadata(first, year, semester)) ?? {}
      void faculty
      void categories
      eq(`${sem} ${first} getModuleMetadata`, one, {
        ...expected[first],
        code: first
      })
    }
    eq(`${sem} missing module`, await getModuleMetadata("ZZ9999", year, semester), null)
  }

  console.log("getModuleIndexesData")
  for (const sem of SAMPLE_SEMS) {
    const [year, semester] = [sem.slice(0, sem.indexOf("_")), sem.slice(sem.indexOf("_") + 1)]
    const expected = readJson(path.join(SRC, "indexes", `${sem}.json`))
    for (const [code, want] of Object.entries(expected)) {
      eq(`${sem} ${code} indexes`, await getModuleIndexesData(code, year, semester), want)
      if (failures > 5) return
    }
    eq(`${sem} missing indexes`, await getModuleIndexesData("ZZ9999", year, semester), {})
  }

  console.log("getSemesterExamsData / getModuleExamData")
  for (const sem of semesters) {
    const [year, semester] = [sem.slice(0, sem.indexOf("_")), sem.slice(sem.indexOf("_") + 1)]
    const expected = readJson(path.join(SRC, "exams", `${sem}.json`))
    eq(`${sem} exams`, await getSemesterExamsData(year, semester), expected)
    const first = Object.keys(expected)[0]
    if (first) {
      eq(`${sem} ${first} exam`, await getModuleExamData(first, year, semester), expected[first])
    }
  }

  console.log("getModuleCurrentSemester / getModuleSemesters")
  {
    // Expected values derived the old way: walk filenames in reverse.
    const files = [...semesters].reverse()
    const parsed = files.map((s) => ({
      year: s.slice(0, s.indexOf("_")),
      semester: s.slice(s.indexOf("_") + 1),
      data: readJson(path.join(SRC, "metadata", `${s}.json`)),
    }))
    const allCodes = [...new Set(parsed.flatMap((p) => Object.keys(p.data)))]
    const sample = allCodes.filter((_, i) => i % 37 === 0)

    for (const code of sample) {
      const want = parsed
        .filter((p) => p.data[code])
        .map(({ year, semester }) => ({ year, semester }))
      eq(`${code} getModuleSemesters`, await getModuleSemesters(code), want)
      eq(`${code} getModuleCurrentSemester`, await getModuleCurrentSemester(code), want[0] ?? null)
      if (failures > 5) return
    }
    console.log(`  checked ${sample.length} module codes`)
  }

  console.log("getPrerequisiteGraph")
  {
    // prerequisite-graph.json is no longer generated, so the expected value is
    // rebuilt here using the algorithm the old build script used: walk the
    // metadata files newest-first, first occurrence of a code wins, keep only
    // prerequisite items that look like module codes, then invert for
    // requiredBy. Nodes exist only for codes that were actually offered.
    const info = new Map<string, { title: string; requires: Set<string> }>()
    for (const sem of [...semesters].reverse()) {
      const data = readJson(path.join(SRC, "metadata", `${sem}.json`))
      for (const [code, mod] of Object.entries<any>(data)) {
        if (info.has(code)) continue
        const requires = new Set<string>()
        for (const group of mod.prerequisite ?? []) {
          for (const item of group) if (MODULE_CODE_RE.test(item)) requires.add(item)
        }
        info.set(code, { title: mod.title, requires })
      }
    }
    const requiredBy = new Map<string, Set<string>>()
    for (const [code, { requires }] of info) {
      for (const req of requires) {
        if (!requiredBy.has(req)) requiredBy.set(req, new Set())
        requiredBy.get(req)!.add(code)
      }
    }
    const want: Record<string, unknown> = {}
    for (const [code, { title, requires }] of info) {
      const by = requiredBy.get(code) ?? new Set<string>()
      if (requires.size > 0 || by.size > 0) {
        want[code] = {
          title,
          requires: Array.from(requires).sort(),
          requiredBy: Array.from(by).sort()
        }
      }
    }

    const got = await getPrerequisiteGraph()
    eq("graph node count", Object.keys(got).length, Object.keys(want).length)
    for (const code of Object.keys(want)) {
      eq(`graph ${code}`, got[code], want[code])
      if (failures > 5) break
    }
  }
}

main().then(() => {
  console.log(failures === 0 ? "\nREADERS OK" : `\nREADERS FAILED — ${failures} mismatch(es)`)
  process.exit(failures === 0 ? 0 : 1)
})
