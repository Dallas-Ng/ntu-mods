import CONSOLIDATED_INDEXES from "@/data/consolidated-2023-2-indexes.json"

export const C_INDEXES = CONSOLIDATED_INDEXES as unknown as Record<
  string,
  Index[]
>
