import { INDEX_MAP } from "@/data/api/index-map"

export const getIndex = (indexKey: string): Index[] => {
  return INDEX_MAP[indexKey] ?? []
}
