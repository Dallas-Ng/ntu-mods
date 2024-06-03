export const getModuleLevels = (moduleKeys: [string, Module][]) => {
  return moduleKeys.reduce((levels, [key]) => {
    const int = parseInt(key.slice(2, 3))

    // Only set keys which are numbers
    // Mods like `ADP26N` "P" character keys is hidden from user
    // Mods like CC00002, 0 key is hidden from user
    if (!isNaN(int) && int > 0) {
      levels.add(int.toString())
    }

    return levels
  }, new Set<string>())
}
