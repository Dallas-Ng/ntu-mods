import { M_AU } from "@/data/2024/m-au"

export const getModuleAu = (moduleCode: string): string => {
  return M_AU[moduleCode]
}
