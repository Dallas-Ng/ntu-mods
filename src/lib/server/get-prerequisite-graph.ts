import fs from "fs/promises"
import path from "path"

export interface PrerequisiteNode {
  title: string
  requires: string[]
  requiredBy: string[]
}

type PrerequisiteGraph = Record<string, PrerequisiteNode>

let cache: PrerequisiteGraph | null = null

export async function getPrerequisiteGraph(): Promise<PrerequisiteGraph> {
  if (cache) return cache
  const filePath = path.join(
    process.cwd(),
    "src/data/api/prerequisite-graph.json"
  )
  const raw = await fs.readFile(filePath, "utf-8")
  cache = JSON.parse(raw) as PrerequisiteGraph
  return cache
}

export async function getModulePrerequisites(
  code: string
): Promise<PrerequisiteNode | null> {
  const graph = await getPrerequisiteGraph()
  return graph[code] ?? null
}
