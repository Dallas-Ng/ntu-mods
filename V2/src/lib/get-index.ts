import { INDEXES } from "@/data/2023/indexes"

export const getIndex = (indexKey: string): Index[] | undefined => {
  return INDEXES[indexKey]
}
