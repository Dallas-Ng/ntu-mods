/**
 * Prebuild script: copies/generates static data files into public/data/api/
 * so they can be served from Vercel's CDN without serverless function invocations.
 */

import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const SRC_DATA = path.join(ROOT, "src/data/api")
const PUBLIC_DATA = path.join(ROOT, "public/data/api")

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  const files = await fs.readdir(src)
  await Promise.all(
    files.map((f) => fs.copyFile(path.join(src, f), path.join(dest, f)))
  )
  console.log(`  Copied ${files.length} files: ${src} → ${dest}`)
}

async function buildModulesJson() {
  const metadataDir = path.join(SRC_DATA, "metadata")
  const semestersRaw = await fs.readFile(
    path.join(SRC_DATA, "semesters.json"),
    "utf-8"
  )
  const semesters = JSON.parse(semestersRaw)
  const latestCode = semesters[0].code
  const [latestYear, latestSemester] = latestCode.split(";")

  const files = (await fs.readdir(metadataDir))
    .filter((f) => f.endsWith(".json"))
    .sort()

  const modulesMap = new Map()
  const currentSemesterSet = new Set()

  const allData = await Promise.all(
    files.map((f) => fs.readFile(path.join(metadataDir, f), "utf-8").then(JSON.parse))
  )

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const stem = file.replace(".json", "")
    const idx = stem.indexOf("_")
    const fileYear = stem.slice(0, idx)
    const fileSemester = stem.slice(idx + 1)
    const data = allData[i]
    const isCurrentFile =
      fileYear === latestYear && fileSemester === latestSemester

    for (const [code, module] of Object.entries(data)) {
      modulesMap.set(code, { ...module, code, latestYear: fileYear, latestSemester: fileSemester })
      if (isCurrentFile) currentSemesterSet.add(code)
    }
  }

  const modules = Array.from(modulesMap.values())
    .map((m) => ({ ...m, isCurrentSemester: currentSemesterSet.has(m.code) }))
    .sort((a, b) => a.code.localeCompare(b.code))

  const outPath = path.join(PUBLIC_DATA, "modules.json")
  await fs.writeFile(outPath, JSON.stringify({ modules }))
  console.log(`  Built modules.json (${modules.length} modules)`)
}

async function buildRandomSamples() {
  const semestersRaw = await fs.readFile(
    path.join(SRC_DATA, "semesters.json"),
    "utf-8"
  )
  const semesters = JSON.parse(semestersRaw)
  const [year, semester] = semesters[0].code.split(";")

  const metadataRaw = await fs.readFile(
    path.join(SRC_DATA, "metadata", `${year}_${semester}.json`),
    "utf-8"
  )
  const metadata = JSON.parse(metadataRaw)

  const indexesRaw = await fs.readFile(
    path.join(SRC_DATA, "indexes", `${year}_${semester}.json`),
    "utf-8"
  )
  const indexes = JSON.parse(indexesRaw)

  // Only modules with at least one index slot with a real day
  const eligible = Object.keys(metadata).filter((code) => {
    const moduleIndexes = indexes[code]
    if (!moduleIndexes) return false
    return Object.values(moduleIndexes).some((slots) =>
      slots.some((s) => s.day !== 0)
    )
  })

  const samples = []
  const shuffled = [...eligible].sort(() => Math.random() - 0.5)

  for (const code of shuffled) {
    if (samples.length >= 200) break
    const moduleIndexes = indexes[code]
    if (!moduleIndexes) continue
    const indexKeys = Object.keys(moduleIndexes)
    if (!indexKeys.length) continue
    const indexKey = indexKeys[Math.floor(Math.random() * indexKeys.length)]
    const slots = moduleIndexes[indexKey]
    const index = slots?.find((s) => s.day !== 0)
    if (!index) continue
    const meta = metadata[code]
    samples.push({ code, title: meta.title, au: meta.au, indexKey, index })
  }

  const outPath = path.join(PUBLIC_DATA, "random-samples.json")
  await fs.writeFile(outPath, JSON.stringify(samples))
  console.log(`  Built random-samples.json (${samples.length} samples)`)
}

async function main() {
  console.log("Building static data files...")
  await fs.mkdir(PUBLIC_DATA, { recursive: true })

  await Promise.all([
    copyDir(path.join(SRC_DATA, "indexes"), path.join(PUBLIC_DATA, "indexes")),
    copyDir(path.join(SRC_DATA, "exams"), path.join(PUBLIC_DATA, "exams")),
    fs.copyFile(
      path.join(SRC_DATA, "semesters.json"),
      path.join(PUBLIC_DATA, "semesters.json")
    ).then(() => console.log("  Copied semesters.json")),
    buildModulesJson(),
    buildRandomSamples(),
  ])

  console.log("Done.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
