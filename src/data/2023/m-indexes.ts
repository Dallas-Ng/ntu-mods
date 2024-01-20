import M_INDEXES_JSON from "./m-indexes.json"

export const M_INDEXES = M_INDEXES_JSON as {
  [moduleKey: string]: { [indexKey: string]: Index[] }
}
