export const getModuleCategories = (searchKeys: string[]): ModuleType[] => {
  const includedCategories = new Set<ModuleType>()

  if (searchKeys.find((x) => x.split(";").length === 4)) {
    // We assume that these are cores based on how they were scrapped
    // 4: "CEEC;;1;F"
    // 5: "CSC;;1;F"
    // 6: "CSEC;;1;F"
    // 7: "DSAI;;1;F"
    // 8: "ECDS;;1;F"
    includedCategories.add("CORE")
  }

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

  return Array.from(includedCategories) as ModuleType[]
}
