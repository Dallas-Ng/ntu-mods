// What the WebMCP docs pages show, derived from the same tool list the site
// registers and publishes at /.well-known/webmcp.json, so the page cannot
// disagree with the browser.

import { WEBMCP_TOOLS } from "@/lib/webmcp/definitions"

const GROUPS: [string, string[]][] = [
  ["Orientation", ["get_site_info", "get_current_page", "navigate_to"]],
  [
    "Module, index and exam data",
    [
      "list_semesters",
      "search_modules",
      "get_module",
      "get_module_indexes",
      "find_compatible_indexes",
      "get_exam",
      "list_exams"
    ]
  ],
  [
    "Your timetable",
    [
      "get_timetable",
      "list_plans",
      "add_module_to_timetable",
      "import_modules",
      "remove_module_from_timetable",
      "set_module_index",
      "set_module_lock",
      "switch_plan",
      "clear_plan",
      "add_custom_block",
      "remove_custom_block"
    ]
  ],
  [
    "Generation",
    ["get_generation_config", "update_generation_config", "generate_timetables"]
  ],
  [
    "Share, export and favourites",
    [
      "get_share_link",
      "load_shared_timetable",
      "export_calendar_ics",
      "list_favourites",
      "set_favourite"
    ]
  ],
  ["Grades", ["calculate_cgpa_targets", "project_cgpa"]],
  ["Page-specific", ["get_current_module"]]
]

export const webmcpToolCount = WEBMCP_TOOLS.length

export const webmcpGroups = GROUPS.map(([name, names]) => ({
  name,
  tools: names.flatMap((toolName) => {
    const tool = WEBMCP_TOOLS.find((t) => t.name === toolName)
    return tool
      ? [
          {
            name: tool.name,
            description: tool.description,
            readOnly: tool.readOnly,
            asksFirst: "consequential" in tool && tool.consequential === true
          }
        ]
      : []
  })
}))
