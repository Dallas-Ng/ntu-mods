// The public API of ntumods.com as one OpenAPI 3.1 document. /developers renders
// from this and /developers/openapi.json serves it, so the docs cannot drift.
// Only public, read-only routes belong here. Keep infrastructure details and
// exact limits out: the abuse notes stay deliberately vague.

import { siteConfig } from "@/config/site"

export interface OpenApiInput {
  /** Latest semester with class data, e.g. "2026_2". */
  indexSemester: string
  /** Latest semester with exam data, if any. */
  examSemester: string | null
}

const SEMESTER = {
  type: "string",
  pattern: "^[0-9]{4}_(1|2|S)$",
  description:
    "Academic year and semester as `year_semester`, where the semester is `1`, `2` or `S` (special term)."
}

const SLOW_DOWN = {
  description:
    "Too many requests. Wait the number of seconds in the `Retry-After` header, then try again.",
  headers: {
    "Retry-After": {
      description: "Seconds to wait before retrying.",
      schema: { type: "integer" }
    }
  },
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } }
  }
}

// Bump when an endpoint's behavior or response shape changes.
const UPDATED = "2026-10-19"

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })

const json = (schema: object, example?: unknown) => ({
  "application/json": { schema, ...(example ? { example } : {}) }
})

const ok = (description: string, content: object) => ({
  "200": { description, content }
})

// Shortened from the live response for SC1003.
const MODULE_EXAMPLE = {
  code: "SC1003",
  title: "Introduction To Computational Thinking & Programming",
  au: 3,
  description: "Computational thinking (CT) is the process of analysing ...",
  gradeType: null,
  school: "CSC",
  categories: ["CORE", "MLOAD", "GLOAD"],
  prerequisites: [],
  requires: [],
  requiredBy: ["SC1007", "SC1008", "SC2002"],
  mutuallyExclusiveWith: ["CE1003", "CZ1003", "SC1303"],
  restrictions: {
    notAvailableToProgramme: "AERO, ASEC, BASA, ...",
    notAvailableToAllProgrammeWith: "(Admyr 2011-2020)",
    notAvailableAsCore: null,
    notAvailableAsPe: null,
    notAvailableAsBdeUe: null
  },
  latestOffering: {
    year: "2025",
    semester: "2",
    isCurrentSemester: false,
    indexCount: 4
  },
  otherSemesters: [
    { year: "2025", semester: "1" },
    { year: "2024", semester: "2" }
  ],
  exam: null,
  url: "https://ntumods.com/mods/SC1003"
}

const nullable = (type: string, description: string) => ({
  type: [type, "null"],
  description
})

export function buildOpenApi({ indexSemester, examSemester }: OpenApiInput) {
  const sem = (s: string) => ({ ...SEMESTER, example: s })

  return {
    openapi: "3.1.0",
    info: {
      title: "NTUMods public API",
      version: "1.0.0",
      summary: "Open, read-only NTU module, class index and exam data.",
      description:
        "Free to use, no API key. The data is NTU public course data and may be out of date or wrong, so check STARS before you rely on it. Use is at your own risk. The operator may change, limit or remove any API or dataset at any time, without notice. Please cache responses and keep to a modest request rate; excessive use returns `429` with a `Retry-After` header."
    },
    servers: [{ url: siteConfig.url }],
    tags: [
      { name: "Modules", description: "One module as JSON." },
      { name: "Open data", description: "Whole-dataset JSON files." },
      { name: "Discovery", description: "Files for tools and AI assistants." }
    ],
    paths: {
      "/api/modules/{code}": {
        get: {
          tags: ["Modules"],
          operationId: "getModule",
          "x-last-updated": UPDATED,
          summary: "Get one module",
          description:
            "Returns the record behind the module page `/mods/{code}`. Use an uppercase code and no query string. A lowercase code or a query string gets a `308` redirect to the canonical URL.",
          parameters: [
            {
              name: "code",
              in: "path",
              required: true,
              description: "Module code: uppercase letters and digits.",
              schema: {
                type: "string",
                pattern: "^[A-Z0-9]{2,12}$",
                example: "SC1003"
              }
            }
          ],
          responses: {
            "200": {
              description: "The module.",
              content: json(ref("Module"), MODULE_EXAMPLE)
            },
            "308": {
              description:
                "Lowercase code or a query string. Follow the `Location` header to the canonical URL.",
              headers: { Location: { schema: { type: "string" } } }
            },
            "400": {
              description:
                "The code is not 2 to 12 uppercase letters or digits.",
              content: json(ref("Error"), { error: "Invalid module code" })
            },
            "404": {
              description: "No module with that code.",
              content: json(ref("Error"), { error: "No module ZZ9999" })
            },
            "429": SLOW_DOWN,
            "503": {
              description:
                "Temporarily unavailable. Retry after the number of seconds in the `Retry-After` header.",
              headers: SLOW_DOWN.headers,
              content: json(ref("Error"), { error: "Temporarily unavailable" })
            }
          }
        }
      },
      "/data/api/modules.json": {
        get: {
          tags: ["Open data"],
          operationId: "getModuleList",
          "x-last-updated": UPDATED,
          summary: "All modules",
          description:
            "Every module since AY2014, with its most recent offering. This is a large file: download it once and cache it instead of fetching it repeatedly.",
          responses: ok("The module list.", {
            "application/json": {
              schema: ref("ModuleList"),
              "x-example-text": `{
  "modules": [
    {
      "code": "AAA08A",
      "title": "Art As Commodity",
      "au": "3.0",
      "faculty": "NIE",
      "categories": ["CORE", "GLOAD"],
      "latestYear": "2019",
      "latestSemester": "2",
      "isCurrentSemester": false
    },
    ...
  ]
}`
            }
          })
        }
      },
      "/data/api/indexes/{semester}.json": {
        get: {
          tags: ["Open data"],
          operationId: "getIndexes",
          "x-last-updated": UPDATED,
          summary: "Class indexes for a semester",
          description: `Every class index in one semester, keyed by module code and then by index number. The latest semester is \`${indexSemester}\`.`,
          parameters: [
            {
              name: "semester",
              in: "path",
              required: true,
              schema: sem(indexSemester)
            }
          ],
          responses: {
            ...ok("Indexes by module code.", {
              "application/json": {
                schema: ref("IndexMap"),
                "x-example-text": `{
  "SC1003": {
    "10001": [
      {
        "key": "10001",
        "type": "LEC",
        "group": "LE",
        "day": 1,
        "time": "0930-1020",
        "venue": "LT1",
        "remarks": "",
        "duration": 2
      },
      ...
    ],
    ...
  },
  ...
}`
              }
            }),
            "404": { description: "No data for that semester." }
          }
        }
      },
      "/data/api/exams/{semester}.json": {
        get: {
          tags: ["Open data"],
          operationId: "getExams",
          "x-last-updated": UPDATED,
          summary: "Exam timetable for a semester",
          description: `Exam date, start and end time, and duration, by module code. Venues are not in this data.${
            examSemester ? ` The latest semester is \`${examSemester}\`.` : ""
          }`,
          parameters: [
            {
              name: "semester",
              in: "path",
              required: true,
              schema: sem(examSemester ?? indexSemester)
            }
          ],
          responses: {
            ...ok("Exams by module code.", {
              "application/json": {
                schema: ref("ExamMap"),
                "x-example-text": `{
  "AB0403": {
    "key": "AB0403",
    "name": "DECISION MAKING WITH PROGRAMMING & ANALYTICS",
    "date": "24 November 2026",
    "day": 2,
    "start_time": "5.00 pm",
    "end_time": "6.30 pm",
    "duration": 3
  },
  ...
}`
              }
            }),
            "404": { description: "No data for that semester." }
          }
        }
      },
      "/.well-known/ai-catalog.json": {
        get: {
          tags: ["Discovery"],
          operationId: "getAiCatalog",
          "x-last-updated": UPDATED,
          summary: "AI catalog",
          description:
            "A machine-readable list of what an AI agent can use on this site, in the ai-catalog format. It always points to the latest semester files.",
          responses: ok("The catalog.", {
            "application/json": {
              schema: { type: "object" },
              "x-example-text": `{
  "specVersion": "1.0",
  "host": {
    "displayName": "NTUMods",
    "identifier": "https://ntumods.com",
    ...
  },
  "entries": [
    {
      "displayName": "Module record API",
      "type": "application/json",
      "url": "https://ntumods.com/api/modules/SC1003",
      ...
    },
    ...
  ]
}`
            }
          })
        }
      },
      "/.well-known/webmcp.json": {
        get: {
          tags: ["Discovery"],
          operationId: "getWebMcpTools",
          "x-last-updated": UPDATED,
          summary: "WebMCP tool list (early developer preview)",
          description:
            "The names and input schemas of the tools the site registers through WebMCP. The tools only run inside a supporting browser tab on ntumods.com, on the visitor's own saved plans. This file is for discovery.",
          responses: ok("The tool list.", {
            "application/json": {
              schema: { type: "object" },
              "x-example-text": `{
  "name": "NTUMods",
  "url": "https://ntumods.com",
  "tools": [
    {
      "name": "search_modules",
      "title": "Search modules",
      "description": "Search NTU modules by code or title. ...",
      "inputSchema": { ... },
      ...
    },
    ...
  ]
}`
            }
          })
        }
      },
      "/llms.txt": {
        get: {
          tags: ["Discovery"],
          operationId: "getLlmsTxt",
          "x-last-updated": UPDATED,
          summary: "Site summary for language models",
          responses: ok("Plain text.", {
            "text/plain": {
              schema: { type: "string" },
              "x-example-text": `# NTUMods

> NTUMods is a free, independent timetable planner, module browser, and exam schedule for Nanyang Technological University (NTU) students in Singapore. ...

## Core Tools

- [Timetable Planner](https://ntumods.com/timetable): Visual timetable builder with automatic clash detection ...
- [Module Browser](https://ntumods.com/mods): Search NTU modules by code or title ...
...`
            }
          })
        }
      },
      "/llms.md": {
        get: {
          tags: ["Discovery"],
          operationId: "getLlmsMd",
          "x-last-updated": UPDATED,
          summary: "Site summary for language models, as Markdown",
          description: "The same content as `/llms.txt`, served as Markdown.",
          responses: ok("Markdown.", {
            "text/markdown": {
              schema: { type: "string" },
              "x-example-text": `# NTUMods

> NTUMods is a free, independent timetable planner, module browser, and exam schedule ...

## Core Tools

- [Timetable Planner](https://ntumods.com/timetable): ...
...`
            }
          })
        }
      }
    },
    components: {
      schemas: {
        Error: {
          type: "object",
          required: ["error"],
          properties: { error: { type: "string" } }
        },
        Semester: {
          type: "object",
          properties: {
            year: { type: "string", example: "2025" },
            semester: { type: "string", enum: ["1", "2", "S"] }
          }
        },
        Module: {
          type: "object",
          properties: {
            code: { type: "string", description: "Module code." },
            title: { type: "string", description: "Module title." },
            au: { type: "number", description: "Academic units." },
            description: nullable("string", "Course description."),
            gradeType: nullable("string", "Grading scheme, when stated."),
            school: nullable("string", "Owning school code."),
            categories: {
              type: "array",
              items: { type: "string" },
              description: "Labels such as `CORE`, `GLOAD` or `MLOAD`."
            },
            prerequisites: {
              type: "array",
              items: { type: "array", items: { type: "string" } },
              description:
                "Groups of module codes. Every group must be met, and any one module in a group meets it."
            },
            requires: {
              type: "array",
              items: { type: "string" },
              description: "All module codes this module depends on."
            },
            requiredBy: {
              type: "array",
              items: { type: "string" },
              description: "Modules that list this one as a prerequisite."
            },
            mutuallyExclusiveWith: {
              type: "array",
              items: { type: "string" },
              description:
                "Modules that cannot be taken together with this one."
            },
            restrictions: {
              type: "object",
              description:
                "Programme restrictions as NTU publishes them. Each field is a free-text list or null.",
              properties: {
                notAvailableToProgramme: nullable(
                  "string",
                  "Programmes that cannot take it."
                ),
                notAvailableToAllProgrammeWith: nullable(
                  "string",
                  "Cohort or programme rule."
                ),
                notAvailableAsCore: nullable("string", "Cannot count as core."),
                notAvailableAsPe: nullable(
                  "string",
                  "Cannot count as a prescribed elective."
                ),
                notAvailableAsBdeUe: nullable(
                  "string",
                  "Cannot count as BDE or UE."
                )
              }
            },
            latestOffering: {
              type: "object",
              description: "The most recent semester the module was offered.",
              properties: {
                year: {
                  type: "string",
                  description: "Academic year, such as `2025`."
                },
                semester: {
                  type: "string",
                  description: "`1`, `2` or `S` (special term)."
                },
                isCurrentSemester: {
                  type: "boolean",
                  description: "True if that is the latest semester."
                },
                indexCount: {
                  type: "integer",
                  description: "Number of class indexes in that semester."
                }
              }
            },
            otherSemesters: {
              type: "array",
              items: ref("Semester"),
              description: "Earlier semesters the module was offered."
            },
            exam: {
              oneOf: [ref("Exam"), { type: "null" }],
              description: "Exam in the latest offering, if one is published."
            },
            url: {
              type: "string",
              format: "uri",
              description: "The module page."
            }
          }
        },
        ModuleList: {
          type: "object",
          properties: {
            modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string", description: "Module code." },
                  title: { type: "string", description: "Module title." },
                  au: {
                    type: "string",
                    description: "Academic units, as text such as `3.0`."
                  },
                  faculty: {
                    type: "string",
                    description: "School code, or empty."
                  },
                  categories: {
                    type: "array",
                    items: { type: "string" },
                    description: "Labels such as `CORE`, `GLOAD` or `MLOAD`."
                  },
                  latestYear: {
                    type: "string",
                    description: "Year of the most recent offering."
                  },
                  latestSemester: {
                    type: "string",
                    description: "Semester of the most recent offering."
                  },
                  isCurrentSemester: {
                    type: "boolean",
                    description: "True if it is offered in the latest semester."
                  },
                  notAvailableToProgramme: {
                    type: "string",
                    description:
                      "Programmes that cannot take it. Only present when set."
                  }
                }
              }
            }
          }
        },
        IndexMap: {
          type: "object",
          description:
            "Module code to index number to the list of class slots.",
          additionalProperties: {
            type: "object",
            additionalProperties: { type: "array", items: ref("ClassSlot") }
          },
          example: {
            SC1003: {
              "10001": [
                {
                  key: "10001",
                  type: "LEC",
                  group: "LE",
                  day: 1,
                  time: "0930-1020",
                  venue: "LT1",
                  remarks: "",
                  duration: 2
                }
              ]
            }
          }
        },
        ClassSlot: {
          type: "object",
          properties: {
            key: { type: "string", description: "Index number." },
            type: {
              type: "string",
              description: "`LEC`, `TUT`, `LAB`, `SEM` and so on."
            },
            group: { type: "string" },
            day: {
              type: "integer",
              description: "Day of the week, `1` Monday to `6` Saturday."
            },
            time: {
              type: "string",
              description: "`HHMM-HHMM`, 24 hour clock."
            },
            venue: { type: "string" },
            remarks: { type: "string", description: "Week pattern and notes." },
            duration: { type: "integer", description: "Length in half hours." }
          }
        },
        Exam: {
          type: "object",
          properties: {
            key: { type: "string", description: "Module code." },
            name: { type: "string", description: "Module title." },
            date: {
              type: "string",
              description: "Exam date as text.",
              example: "23 November 2026"
            },
            day: {
              type: "integer",
              description: "Day of the week, `1` Monday to `7` Sunday."
            },
            start_time: {
              type: "string",
              description: "Start time as text.",
              example: "9.00 am"
            },
            end_time: {
              type: "string",
              description: "End time as text.",
              example: "11.30 am"
            },
            duration: { type: "integer", description: "Length in half hours." }
          }
        },
        ExamMap: {
          type: "object",
          description: "Module code to exam.",
          additionalProperties: ref("Exam")
        }
      }
    }
  }
}

export type OpenApiDocument = ReturnType<typeof buildOpenApi>
