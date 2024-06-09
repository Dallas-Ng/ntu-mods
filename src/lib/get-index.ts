import { INDEXES } from "@/data/2024/indexes"

export const getIndex = (indexKey: string): Index[] => {
  return INDEXES[indexKey]
}
