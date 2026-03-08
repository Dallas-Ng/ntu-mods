import MODULE_MAP_JSON from "./module-map.json"

export interface ModuleMapEntry {
  title: string
  au: string
  indexKeys: string[]
  currentYear: string
  currentSemester: string
}

export const MODULE_MAP = MODULE_MAP_JSON as unknown as Record<string, ModuleMapEntry>
