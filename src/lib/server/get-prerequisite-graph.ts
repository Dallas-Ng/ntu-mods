import { query } from "./db/build-time"

export interface PrerequisiteNode {
  title: string
  requires: string[]
  requiredBy: string[]
}

type PrerequisiteGraph = Record<string, PrerequisiteNode>

let cache: PrerequisiteGraph | null = null

/**
 * Each module's prerequisites as of its most recent offering, plus the inverse
 * edges. Replaces prerequisite-graph.json.
 *
 * Only prerequisite items that resolve to a module code become edges; the
 * remaining 30% are free text ("NGL students are taking AL1001, cannot read
 * AB1088") and cannot be graph edges. Unlike the JSON build, that text is not
 * discarded — it stays in prerequisites.raw_text and can be surfaced later.
 *
 * Modules with no edges in either direction are omitted, matching the previous
 * artifact.
 */
export async function getPrerequisiteGraph(): Promise<PrerequisiteGraph> {
  if (cache) return cache

  // The latest offering of each code, which is where title and prerequisites
  // are taken from.
  const LATEST = `
    latest AS (
      SELECT o.code, o.sem, o.title,
             ROW_NUMBER() OVER (PARTITION BY o.code ORDER BY s.sort_key DESC) AS rn
        FROM offerings o
        JOIN semesters s ON s.sem = o.sem
    )
  `

  const titles = query<{ code: string; title: string }>(
    `WITH ${LATEST} SELECT code, title FROM latest WHERE rn = 1`
  )

  const edges = query<{ code: string; requires: string }>(
    `WITH ${LATEST}
     SELECT DISTINCT l.code AS code, p.requires_code AS requires
       FROM latest l
       JOIN prerequisites p ON p.code = l.code AND p.sem = l.sem
      WHERE l.rn = 1 AND p.requires_code IS NOT NULL
      ORDER BY l.code, p.requires_code`
  )

  const graph: PrerequisiteGraph = {}
  const titleByCode = new Map(titles.map((t) => [t.code, t.title]))

  // A node only exists for a code that was actually offered. A prerequisite may
  // name a module that never appears in the corpus — that stays as an outgoing
  // edge but never becomes a node of its own, which is what the previous
  // artifact did.
  const node = (code: string): PrerequisiteNode | null => {
    const title = titleByCode.get(code)
    if (title === undefined) return null
    return (graph[code] ??= { title, requires: [], requiredBy: [] })
  }

  for (const e of edges) {
    node(e.code)?.requires.push(e.requires)
    node(e.requires)?.requiredBy.push(e.code)
  }

  // requiredBy accumulates in `code` order from the query, but the previous
  // artifact sorted it explicitly. Keep that.
  for (const n of Object.values(graph)) n.requiredBy.sort()

  cache = graph
  return cache
}

export async function getModulePrerequisites(
  code: string
): Promise<PrerequisiteNode | null> {
  const graph = await getPrerequisiteGraph()
  return graph[code] ?? null
}
