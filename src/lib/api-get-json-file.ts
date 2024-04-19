import { promises as fs } from "fs"

const basePath = `${process.cwd()}/scripts/scrapers/data/json`

export const apiGetJsonFile = async <T>(
  filePath: string
): Promise<T | null> => {
  try {
    const buffer = await fs.readFile(`${basePath}${filePath}`, "utf8")
    const json = await JSON.parse(buffer)

    return json as T
  } catch {
    return null
  }
}
