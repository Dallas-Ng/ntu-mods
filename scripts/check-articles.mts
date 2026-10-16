/**
 * Lists articles whose academic-year wording looks out of date, as a checklist
 * for the semester refresh in AGENTS.md. Advisory only: it exits 0 unless run
 * with --strict, because old articles legitimately talk about past years.
 *
 *   yarn check:articles [--strict]
 */

import fs from "fs"
import path from "path"

const ROOT = path.resolve(import.meta.dirname, "..")
const ARTICLES = path.join(ROOT, "content/articles")

const semesters = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/api/semesters.json"), "utf-8")
) as Array<{ code: string }>
const latestYear = Number(semesters[0].code.split(";")[0])

const AY_MENTION = /\bAY\s?(20\d\d)(?:\s?\/\s?(?:20)?\d\d)?/gi

const stale: Array<{ file: string; years: number[] }> = []

for (const file of fs.readdirSync(ARTICLES)) {
  if (!file.endsWith(".md") || file.startsWith("_")) continue
  const text = fs.readFileSync(path.join(ARTICLES, file), "utf-8")
  const years = [...text.matchAll(AY_MENTION)].map((m) => Number(m[1]))
  if (years.length === 0) continue
  // Mentions only of earlier years: nothing in it speaks about the current one
  if (Math.max(...years) < latestYear) {
    stale.push({ file, years: [...new Set(years)].sort() })
  }
}

if (stale.length === 0) {
  console.log(`No article is stuck before AY${latestYear}.`)
} else {
  console.log(
    `${stale.length} article(s) only mention academic years before AY${latestYear}:`
  )
  for (const { file, years } of stale) {
    console.log(`  ${file}  (AY${years.join(", AY")})`)
  }
}

if (stale.length > 0 && process.argv.includes("--strict")) process.exit(1)
