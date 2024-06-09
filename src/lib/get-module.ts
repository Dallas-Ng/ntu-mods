import { M_DATA } from "@/data/2024/m-data"

export const getModule = (moduleCode: string): Module => {
  return M_DATA[moduleCode]
}
