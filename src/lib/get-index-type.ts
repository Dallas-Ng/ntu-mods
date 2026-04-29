export const getIndexType = (type: string) => {
  if (type.includes("LEC")) return "LEC"
  if (type.includes("LAB")) return "LAB"
  if (type.includes("SEM")) return "SEM"
  if (type.includes("TUT")) return "TUT"
  if (type.includes("DES")) return "DES"
  if (type.includes("PRJ")) return "PRJ"

  return "LEC"
}
