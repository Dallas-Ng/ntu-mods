import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import type { APIRoute } from "astro"

import { siteConfig } from "@/config/site"

export const prerender = true

export const GET: APIRoute = async () => {
  const name = "ntu-module-lookup"
  const path = `/.well-known/agent-skills/${name}/SKILL.md`
  const artifact = await readFile(`public${path}`)

  return Response.json({
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name,
        type: "skill-md",
        description:
          "Look up NTU modules, class indexes and exam timetables using NTUMods public data.",
        url: `${siteConfig.url}${path}`,
        digest: `sha256:${createHash("sha256").update(artifact).digest("hex")}`
      }
    ]
  })
}
