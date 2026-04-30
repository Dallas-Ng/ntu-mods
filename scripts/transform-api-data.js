#!/usr/bin/env node

/**
 * Transform scraper data to API format
 * Usage: node scripts/transform-api-data.js
 *
 * Input: scraper/data/*.json
 * Output: src/data/api/
 *   - src/data/api/semesters.json
 *   - src/data/api/metadata/{year}_{semester}.json
 *   - src/data/api/indexes/{year}_{semester}.json
 */

const fs = require("fs")
const path = require("path")

const SCRAPER_DATA_DIR = path.join(__dirname, "../scraper/data")
const API_DATA_DIR = path.join(__dirname, "../src/data/api")
const METADATA_DIR = path.join(API_DATA_DIR, "metadata")
const INDEXES_DIR = path.join(API_DATA_DIR, "indexes")

// Create directories if they don't exist
;[API_DATA_DIR, METADATA_DIR, INDEXES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

/**
 * Main transformation logic
 */
async function transformData() {
  try {
    console.log("🔄 Starting data transformation...\n")

    // 1. Copy semesters.json
    console.log("📋 Copying semesters.json...")
    const semestersPath = path.join(SCRAPER_DATA_DIR, "01_semesters.json")
    const semestersData = JSON.parse(fs.readFileSync(semestersPath, "utf-8"))
    fs.writeFileSync(
      path.join(API_DATA_DIR, "semesters.json"),
      JSON.stringify(semestersData, null, 2)
    )
    console.log(`✅ Semesters copied: ${semestersData.length} entries\n`)

    // 2. Find and process all mdata and indexes files
    console.log("🔍 Discovering metadata and indexes files...")
    const files = fs.readdirSync(SCRAPER_DATA_DIR)

    // Group files by semester
    const semesters = new Map()

    files.forEach((file) => {
      const match = file.match(/^(03_mdata|04_indexes)_(\d+)_([012STS])\.json$/)
      if (match) {
        const [, type, year, sem] = match
        const key = `${year}_${sem}`
        if (!semesters.has(key)) {
          semesters.set(key, {})
        }
        semesters.get(key)[type === "03_mdata" ? "metadata" : "indexes"] = file
      }
    })

    console.log(`✅ Found ${semesters.size} semesters to process\n`)

    // 3. Transform each semester's data
    for (const [key, files] of semesters) {
      const [year, sem] = key.split("_")
      console.log(`📦 Processing ${key}...`)

      // Process metadata
      if (files.metadata) {
        const metadataPath = path.join(SCRAPER_DATA_DIR, files.metadata)
        const metadataData = JSON.parse(fs.readFileSync(metadataPath, "utf-8"))

        const outputPath = path.join(METADATA_DIR, `${year}_${sem}.json`)
        fs.writeFileSync(outputPath, JSON.stringify(metadataData))
        const count = Object.keys(metadataData).length
        console.log(`   ✅ Metadata: ${count} modules`)
      }

      // Process indexes
      if (files.indexes) {
        const indexesPath = path.join(SCRAPER_DATA_DIR, files.indexes)
        const indexesData = JSON.parse(fs.readFileSync(indexesPath, "utf-8"))

        const outputPath = path.join(INDEXES_DIR, `${year}_${sem}.json`)
        fs.writeFileSync(outputPath, JSON.stringify(indexesData))
        const count = Object.keys(indexesData).length
        console.log(`   ✅ Indexes: ${count} module schedules`)
      }
    }

    console.log("\n✨ Data transformation complete!")
    console.log(`📁 Files written to: ${API_DATA_DIR}`)
  } catch (error) {
    console.error("❌ Error during transformation:", error.message)
    process.exit(1)
  }
}

transformData()
