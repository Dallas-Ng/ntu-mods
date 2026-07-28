import { query } from "./db/build-time"
import { OFFERING_INDEX_KEYS_SQL, OFFERING_SLOTS_SQL } from "./db/queries"
import { toIndexes } from "./db/shape"
import type { SlotRow } from "./db/shape"

/**
 * Class schedule indexes for a module in one semester.
 * Returns an empty object when the module was not offered that semester.
 *
 * Index keys are read from class_indexes rather than inferred from the slot
 * rows: 24 offerings across the corpus have an index with no slots, and the
 * JSON this replaces represented those as a present-but-empty entry.
 */
export async function getModuleIndexesData(
  code: string,
  year: string,
  semester: string
): Promise<Record<string, Index[]>> {
  const sem = `${year}_${semester}`
  const keys = query<{ index_key: string }>(
    OFFERING_INDEX_KEYS_SQL,
    code,
    sem
  ).map((r) => r.index_key)
  if (keys.length === 0) return {}
  return toIndexes(query<SlotRow>(OFFERING_SLOTS_SQL, code, sem), keys)
}
