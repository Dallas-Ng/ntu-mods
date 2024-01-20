export const getModuleCategories = (searchKeys: string[]): ModuleType[] => {
  const includedCategories = new Set<ModuleType>()

  for (const key of searchKeys) {
    if (key.includes("GLOAD")) {
      includedCategories.add("GLOAD")
    } else if (key.includes("MLOAD")) {
      includedCategories.add("MLOAD")
    } else if (key.includes("GERP")) {
      includedCategories.add("GERP")
    } else if (key.includes("CNY")) {
      includedCategories.add("CNY")
    } else if (key.includes("USP")) {
      includedCategories.add("CNY")
    }
  }

  if (includedCategories.size === 0) {
    includedCategories.add("CORE")
  }

  return Array.from(includedCategories) as ModuleType[]
}
