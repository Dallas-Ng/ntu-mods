import type { IndexTypeColorKey } from "@/config/appearance-settings"

export const getIndexType = (type: string) => {
  if (type.includes("LEC")) return "LEC"
  if (type.includes("LAB")) return "LAB"
  if (type.includes("SEM")) return "SEM"
  if (type.includes("TUT")) return "TUT"
  if (type.includes("DES")) return "DES"
  if (type.includes("PRJ")) return "PRJ"

  return "LEC"
}

/** The lower-case key the colour tokens and settings use. */
export const getIndexColorKey = (type: string) =>
  getIndexType(type).toLowerCase() as IndexTypeColorKey
