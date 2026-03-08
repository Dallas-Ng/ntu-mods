import fs from "fs/promises"
import path from "path"

const METADATA_DIR = path.join(process.cwd(), "src/data/api/metadata")

/** Parse a metadata filename like "2025_2.json" → { year: "2025", semester: "2" } */
function parseFilename(filename: string): { year: string; semester: string } {
  const stem = filename.replace(".json", "") // "2025_2"
  const idx = stem.lastIndexOf("_")
  return { year: stem.slice(0, idx), semester: stem.slice(idx + 1) }
}

async function getSortedMetadataFiles(): Promise<string[]> {
  const files = await fs.readdir(METADATA_DIR)
  return files.filter((f) => f.endsWith(".json")).sort()
}

/**
 * Find the most recent metadata file that contains the given module code.
 * Files are sorted ascending (2023_1 → 2025_2); we walk in reverse.
 */
export async function getModuleCurrentSemester(
  code: string
): Promise<{ year: string; semester: string } | null> {
  const files = await getSortedMetadataFiles()
  for (const file of [...files].reverse()) {
    const filePath = path.join(METADATA_DIR, file)
    const data = await fs.readFile(filePath, "utf-8")
    const obj = JSON.parse(data) as Record<string, unknown>
    if (obj[code]) return parseFilename(file)
  }
  return null
}

/**
 * Return all semesters (most recent first) that contain the given module code.
 */
export async function getModuleSemesters(
  code: string
): Promise<Array<{ year: string; semester: string }>> {
  const files = await getSortedMetadataFiles()
  const result: Array<{ year: string; semester: string }> = []
  for (const file of [...files].reverse()) {
    const filePath = path.join(METADATA_DIR, file)
    const data = await fs.readFile(filePath, "utf-8")
    const obj = JSON.parse(data) as Record<string, unknown>
    if (obj[code]) result.push(parseFilename(file))
  }
  return result
}
