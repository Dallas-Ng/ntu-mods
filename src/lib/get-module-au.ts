import { MODULE_MAP } from "@/data/api/module-map"

export const getModuleAu = (moduleCode: string): string => {
  return MODULE_MAP[moduleCode]?.au ?? "Unspecified"
}
