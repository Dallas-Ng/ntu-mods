// What the MCP docs page shows, derived from the same tool list /mcp registers,
// so the page cannot disagree with the server.

import { siteConfig } from "@/config/site"
import { MCP_TOOLS } from "@/lib/mcp/tools"

type Prop = { type?: string; enum?: string[]; description?: string }

export const mcpUrl = `${siteConfig.url}/mcp`

export const mcpTools = MCP_TOOLS.map((tool) => {
  const schema = tool.inputSchema as {
    properties: Record<string, Prop>
    required: string[]
  }
  return {
    name: tool.name,
    description: tool.description,
    inputs: Object.entries(schema.properties).map(([name, prop]) => ({
      name,
      type: prop.enum ? prop.enum.join(" | ") : (prop.type ?? "any"),
      required: schema.required.includes(name),
      description: prop.description ?? ""
    }))
  }
})

// Official listings, shown first on the docs page. `url: null` renders as
// "Coming soon", so a listing that is not live yet is never linked.
export const directoryListings = [
  { name: "Claude", url: siteConfig.links.claudeDirectory as string | null },
  { name: "ChatGPT", url: siteConfig.links.openaiDirectory }
]

export const claudeCodeCommand = `claude mcp add --transport http ntumods ${mcpUrl}`
export const claudeCodeUserCommand = `claude mcp add --transport http --scope user ntumods ${mcpUrl}`

export const codexCommand = `codex mcp add ntumods --url ${mcpUrl}`
export const codexToml = `[mcp_servers.ntumods]
url = "${mcpUrl}"`

export const vscodeConfig = JSON.stringify(
  { servers: { ntumods: { type: "http", url: mcpUrl } } },
  null,
  2
)

export const mcpRemoteCommand = `npx -y mcp-remote ${mcpUrl}`

export const cursorConfig = JSON.stringify(
  { mcpServers: { ntumods: { url: mcpUrl } } },
  null,
  2
)

// What each tool returns and a question that would make an assistant call it.
// Kept beside the tool list so a new tool cannot ship without a docs entry (see
// tests/lib/developers/mcp-docs.test.ts).
export const mcpToolNotes: Record<
  string,
  { ask: string; returns: string; tip?: string }
> = {
  list_semesters: {
    ask: "Which semesters have data?",
    returns:
      "The current semester code and every semester with data, newest first, as { code, name } pairs such as 2026;2.",
    tip: "Call it first when a question depends on which semester is current."
  },
  search_modules: {
    ask: "Which 3 AU CSC modules are offered this semester?",
    returns:
      "{ total, shown, modules[] }. Each module has code, title, au, school, categories, offeredThisSemester, lastOffered and a url. total counts every match, and shown is capped by limit.",
    tip: "Filters combine. The default is the latest semester only, so set currentSemesterOnly to false to search older modules."
  },
  get_module: {
    ask: "What are the prerequisites for SC2001?",
    returns:
      "The full module record: description, grade type, prerequisite groups, requires, requiredBy, mutually exclusive modules, restrictions, semesters offered and the exam. It is the same record as the REST API.",
    tip: "Prerequisites are groups. Every group must be met, and any one module in a group meets it."
  },
  get_module_indexes: {
    ask: "What indexes does SC1004 have, and when are the labs?",
    returns:
      "{ code, semester, indexCount, indexes[] }. Each index lists its slots with type, group, day name, time, venue and remarks.",
    tip: "Defaults to the latest semester. Pass year and semester for an older one."
  },
  get_exam: {
    ask: "When is the SC1004 exam?",
    returns:
      "The exam date, start and end time and duration for one module, with the semester it belongs to. Venue is always reported as not published.",
    tip: "A module with no exam in that semester returns a tool error, not an empty result."
  },
  list_exams: {
    ask: "What else is on 23 November?",
    returns:
      "{ semester, total, exams[] }, filtered by a text query on code or name and by date, capped by limit.",
    tip: "The date can be 2026-11-23 or 23 November 2026."
  }
}
