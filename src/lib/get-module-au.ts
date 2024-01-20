import { M_AU } from "@/data/2023/m-au"

export const getModuleAu = (moduleCode: string): string => {
  return M_AU[moduleCode]
}
