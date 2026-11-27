// /.well-known/ai-catalog.json: a machine-readable list of what an AI agent
// can use on this site. Format: https://github.com/Agent-Card/ai-catalog
// (specVersion 1.0, entries typed by `type`, each with `url` or inline `data`).

import { siteConfig } from "@/config/site"

export interface AiCatalogInput {
  /** Latest semester with class data, e.g. "2026_2". */
  indexSemester: string
  /** Latest semester with exam data, if any. */
  examSemester: string | null
  updatedAt: string
}

export const WEBMCP_MEDIA_TYPE = "application/webmcp-tools+json"

export function buildAiCatalog({
  indexSemester,
  examSemester,
  updatedAt
}: AiCatalogInput) {
  const abs = (path: string) => `${siteConfig.url}${path}`
  const publisher = new URL(siteConfig.url).hostname
  const entry = (
    identifier: string,
    type: string,
    path: string,
    displayName: string,
    description: string,
    tags: string[],
    representativeQueries: string[]
  ) => ({
    identifier: `urn:air:${publisher}:catalog:${identifier}`,
    displayName,
    type,
    url: abs(path),
    description,
    tags,
    representativeQueries,
    updatedAt
  })

  return {
    specVersion: "1.0",
    host: {
      displayName: siteConfig.name,
      identifier: siteConfig.url,
      documentationUrl: abs("/ai-instructions"),
      logoUrl: abs("/logo.png")
    },
    entries: [
      entry(
        "webmcp-tools",
        WEBMCP_MEDIA_TYPE,
        "/.well-known/webmcp.json",
        "NTUMods WebMCP tools",
        "Tools the site registers with WebMCP (document.modelContext) in supporting browsers: search modules, read indexes and exams, build and generate timetables, export to calendar, and plan CGPA. This file lists their names and input schemas; calling them needs a browser tab on ntumods.com.",
        ["webmcp", "tools", "timetable", "ntu"],
        [
          "How can I build an NTU timetable with an in-browser assistant?",
          "Which WebMCP tools can export my NTUMods timetable?"
        ]
      ),
      entry(
        "mcp-server",
        "application/mcp-server-card+json",
        "/mcp/server-card",
        "NTUMods MCP server",
        "Connection details for the public, read-only MCP server. It provides tools to list semesters, search modules, and read module records, class indexes and exams.",
        ["mcp", "tools", "modules", "ntu"],
        [
          "How do I connect an MCP client to NTUMods?",
          "Which MCP tools can look up NTU module prerequisites?"
        ]
      ),
      entry(
        "llms-txt",
        "text/plain",
        "/llms.txt",
        "NTUMods llms.txt",
        "Site summary and page index for language models, following the llms.txt convention.",
        ["llms.txt", "documentation"],
        [
          "Where is the NTUMods llms.txt site index?",
          "Where can a language model find a plain-text guide to NTUMods?"
        ]
      ),
      entry(
        "llms-md",
        "text/markdown",
        "/llms.md",
        "NTUMods llms.md",
        "The same summary as llms.txt, served as Markdown.",
        ["llms.txt", "documentation"],
        [
          "Where can I get the NTUMods site summary in Markdown?",
          "Which NTUMods pages are available for AI assistants to reference?"
        ]
      ),
      entry(
        "ai-instructions",
        "text/html",
        "/ai-instructions",
        "NTUMods reference for AI systems",
        "Long-form reference: what NTUMods does and does not do, NTU terminology (STARS, index, AU, BDE), and guidance on citing it.",
        ["documentation", "ntu"],
        [
          "What do STARS, AU and BDE mean at NTU?",
          "How should an AI assistant cite NTUMods?"
        ]
      ),
      entry(
        "module-api",
        "application/json",
        "/api/modules/SC1003",
        "Module record API",
        "GET /api/modules/{code} returns one NTU module as JSON: description, AU, prerequisites, exclusions, restrictions and exam. The URL shown is an example; replace SC1003 with any module code. No authentication, CORS open, read-only. Please cache responses and keep to a modest request rate; excessive use returns 429 with a Retry-After header.",
        ["api", "modules", "ntu"],
        [
          "How do I fetch the NTU SC1003 module record as JSON?",
          "Where can I look up the prerequisites and exclusions for an NTU module by code?"
        ]
      ),
      entry(
        "modules-dataset",
        "application/json",
        "/data/api/modules.json",
        "All NTU modules",
        "Every module NTUMods knows about since AY2014 with code, title, AU, school, categories and whether it is offered this semester.",
        ["dataset", "modules", "ntu"],
        [
          "Where can I download the full NTU module catalogue?",
          "How do I get module codes, titles and academic units in bulk?"
        ]
      ),
      entry(
        "indexes-dataset",
        "application/json",
        `/data/api/indexes/${indexSemester}.json`,
        "Class indexes, latest semester",
        "Every class index for the latest semester, keyed by module code then index, with day, time, venue and class type. Replace the semester in the path (for example 2026_1) for earlier ones.",
        ["dataset", "timetable", "ntu"],
        [
          "Where can I download this semester's NTU class indexes?",
          "Which dataset lists NTU class times and venues by module and index?"
        ]
      ),
      ...(examSemester
        ? [
            entry(
              "exams-dataset",
              "application/json",
              `/data/api/exams/${examSemester}.json`,
              "Exam timetable, latest semester",
              "Exam date, start and end time and duration by module code. Venues are not published in this data.",
              ["dataset", "exams", "ntu"],
              [
                "Where can I download the latest NTU exam timetable as JSON?",
                "Which dataset lists exam dates and durations by NTU module code?"
              ]
            )
          ]
        : [])
    ]
  }
}
