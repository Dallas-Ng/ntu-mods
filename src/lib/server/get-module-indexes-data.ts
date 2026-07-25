import fs from "fs/promises"
import path from "path"

const INDEXES_DIR = path.join(process.cwd(), "src/data/api/indexes")

// This file is shared across every module offered in a semester (up to
// ~800KB) — without caching, generating all the historic snapshot pages for
// one semester re-reads and re-parses the same file once per module.
const fileCache = new Map<string, Record<string, Record<string, Index[]>>>()

async function readIndexesFile(
  year: string,
  semester: string
): Promise<Record<string, Record<string, Index[]>>> {
  const key = `${year}_${semester}`
  const cached = fileCache.get(key)
  if (cached) return cached

  const filePath = path.join(INDEXES_DIR, `${year}_${semester}.json`)
  let result: Record<string, Record<string, Index[]>>
  try {
    await fs.access(filePath)
    const data = await fs.readFile(filePath, "utf-8")
    result = JSON.parse(data) as Record<string, Record<string, Index[]>>
  } catch {
    result = {}
  }
  fileCache.set(key, result)
  return result
}

/**
 * Read class schedule indexes for a module in a specific semester.
 * Returns an empty object if the file or module is not found.
 */
export async function getModuleIndexesData(
  code: string,
  year: string,
  semester: string
): Promise<Record<string, Index[]>> {
  const obj = await readIndexesFile(year, semester)
  return obj[code] ?? {}
}
