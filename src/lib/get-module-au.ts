import { M_AU } from "@/data/2024/m-au"

export const getModuleAu = (moduleCode: string): string => {
  if (moduleCode in M_AU) {
    return M_AU[moduleCode]
  }

  return `Unspecified`
}
