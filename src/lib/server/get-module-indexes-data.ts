import fs from "fs/promises"
import path from "path"

const INDEXES_DIR = path.join(process.cwd(), "src/data/api/indexes")

/**
 * Read class schedule indexes for a module in a specific semester.
 * Filters out invalid day=0 entries.
 * Returns an empty object if the file or module is not found.
 */
export async function getModuleIndexesData(
  code: string,
  year: string,
  semester: string
): Promise<Record<string, Index[]>> {
  const filePath = path.join(INDEXES_DIR, `${year}_${semester}.json`)
  try {
    await fs.access(filePath)
    const data = await fs.readFile(filePath, "utf-8")
    const obj = JSON.parse(data) as Record<string, Record<string, Index[]>>
    const moduleIndexes = obj[code]
    if (!moduleIndexes) return {}

    // Filter out invalid day=0 entries (mirrors legacy get-module-indexes.ts)
    return Object.fromEntries(
      Object.entries(moduleIndexes).map(([key, slots]) => [
        key,
        slots.filter((s) => s.day !== 0)
      ])
    )
  } catch {
    return {}
  }
}
