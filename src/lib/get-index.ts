import { INDEXES } from "@/data/2023/indexes"

export const getIndex = (indexKey: string): Index[] => {
  return INDEXES[indexKey]
}
