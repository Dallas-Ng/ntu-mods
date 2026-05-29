import fs from "fs/promises"
import path from "path"

/**
 * Server-side module data. Structurally overlaps with the global Module type
 * but description is optional here (not all entries have it) and includes
 * additional server/API-only fields.
 */
export interface ApiModule {
  code: string
  title: string
  au: string
  searchKeys: string[]
  prerequisite?: string[][]
  description?: string
  gradeType?: string
  mutuallyExclusiveWith?: string[]
  notAvailableToProgramme?: string
  notAvailableToAllProgrammeWith?: string
  notAvailableAsBdeueToProgramme?: string
  notAvailableAsCoreToProgramme?: string
  notAvailableAsPeToProgramme?: string
  notOfferedAsBde?: string
  notOfferedAsUe?: string
  extras?: Record<string, string>
  isCurrentSemester?: boolean
  latestYear?: string
  latestSemester?: string
}

const METADATA_DIR = path.join(process.cwd(), "src/data/api/metadata")

async function readMetadataFile(
  year: string,
  semester: string
): Promise<Record<string, ApiModule> | null> {
  const filePath = path.join(METADATA_DIR, `${year}_${semester}.json`)
  try {
    await fs.access(filePath)
    const data = await fs.readFile(filePath, "utf-8")
    return JSON.parse(data) as Record<string, ApiModule>
  } catch {
    return null
  }
}

/** Read a specific semester file and return a single module, or null if not found. */
export async function getModuleMetadata(
  code: string,
  year: string,
  semester: string
): Promise<ApiModule | null> {
  const obj = await readMetadataFile(year, semester)
  if (!obj) return null
  const mod = obj[code]
  return mod ? { ...mod, code } : null
}

/** Read a specific semester file and return all modules (for generateStaticParams). */
export async function getAllModuleMetadata(
  year: string,
  semester: string
): Promise<Record<string, ApiModule>> {
  const obj = await readMetadataFile(year, semester)
  if (!obj) return {}
  return Object.fromEntries(
    Object.entries(obj).map(([code, mod]) => [code, { ...mod, code }])
  )
}
