// Search over the campus places: ranked, forgiving and fast enough to run on
// every (debounced) keystroke over a thousand entries.

export interface Searchable {
  name: string
  sub: string
  /** Extra words that should find this place (its category, common names). */
  alias?: string
  /** Busier places rank a little higher. */
  weight?: number
  kind: "venue" | "landmark" | "building"
}

/** What students type vs the words the map uses. */
const SYNONYMS: Record<string, string[]> = {
  gym: ["fitness", "sports"],
  gyms: ["gym", "fitness"],
  fitness: ["gym"],
  swim: ["swimming", "pool"],
  pool: ["swimming"],
  toilet: ["restroom", "washroom"],
  toilets: ["toilet"],
  wc: ["toilet"],
  canteen: ["food", "court", "koufu"],
  eat: ["food", "canteen"],
  lunch: ["food", "canteen"],
  hawker: ["food", "court"],
  coffee: ["cafe"],
  cafe: ["coffee"],
  carpark: ["parking", "car"],
  parking: ["car", "park"],
  hostel: ["hall", "residence"],
  dorm: ["hall", "residence"],
  residence: ["hall"],
  lecture: ["lt"],
  theatre: ["lt"],
  lt: ["lecture", "theatre"],
  bus: ["stop"],
  mrt: ["station"],
  clinic: ["health", "medical", "uhs"],
  doctor: ["clinic", "health"],
  atm: ["bank"],
  bank: ["atm"],
  print: ["printing"],
  library: ["study"],
  study: ["library", "lounge"]
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim()

interface Indexed {
  name: string
  nameWords: string[]
  otherWords: string[]
}

const cache = new WeakMap<object, Indexed>()

const index = (p: Searchable): Indexed => {
  let i = cache.get(p)
  if (!i) {
    const name = norm(p.name)
    i = {
      name,
      nameWords: name.split(" "),
      otherWords: norm(`${p.sub} ${p.alias ?? ""}`)
        .split(" ")
        .filter(Boolean)
    }
    cache.set(p, i)
  }
  return i
}

/** Best score for one query word against one place, 0 if it does not match. */
const wordScore = (i: Indexed, token: string, alts: string[]) => {
  let best = 0
  for (const [n, alt] of [token, ...alts].entries()) {
    const k = n === 0 ? 1 : 0.6 // a synonym is worth less than what was typed
    let s = 0
    if (i.nameWords.includes(alt)) s = 30
    else if (i.nameWords.some((w) => w.startsWith(alt))) s = 24
    else if (i.otherWords.some((w) => w === alt)) s = 14
    else if (i.otherWords.some((w) => w.startsWith(alt))) s = 11
    else if (alt.length > 2 && i.name.includes(alt)) s = 8
    best = Math.max(best, s * k)
  }
  return best
}

/** Rank `places` for `query`; every word typed must match. Pure and synchronous. */
export const searchPlaces = <T extends Searchable>(
  places: T[],
  query: string,
  limit = 30
): T[] => {
  const q = norm(query)
  if (!q) return []
  const tokens = q.split(" ")
  const scored: [number, T][] = []
  for (const p of places) {
    const i = index(p)
    let total = 0
    for (const t of tokens) {
      const s = wordScore(i, t, SYNONYMS[t] ?? [])
      if (!s) {
        total = 0
        break
      }
      total += s
    }
    if (!total) continue
    if (i.name === q) total += 60
    else if (i.name.startsWith(q)) total += 30
    total += Math.min((p.weight ?? 0) / 150, 8) + (p.kind === "venue" ? 3 : 0)
    total -= i.name.length * 0.05
    scored.push([total, p])
  }
  return scored
    .sort(
      (a, b) =>
        b[0] - a[0] ||
        a[1].name.localeCompare(b[1].name, undefined, { numeric: true })
    )
    .slice(0, limit)
    .map((x) => x[1])
}
