import { promises as fs } from "fs"

export const apiGetJsonFile = async <T>(
  filePath: string
): Promise<T | null> => {
  try {
    const basePath = `${process.cwd()}/scripts/scrapers/data/json`
    const buffer = await fs.readFile(`${basePath}${filePath}`, "utf8")
    const json = await JSON.parse(buffer)

    return json as T
  } catch {
    return null
  }
}
