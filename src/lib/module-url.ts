export const getModuleUrl = (code: string) => `/mods/${code}`

export const getModuleVersionUrl = (
  code: string,
  year: string,
  semester: string
) => `/mods/${code}/${year}/${semester}`
