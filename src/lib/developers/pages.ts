// The pages of the developer docs, in nav order. DevDocsLayout renders the
// side tree (and the phone tabs) from this, and the overview page renders its
// cards from it. `group` is the heading the page sits under in the tree.
export const DEV_PAGES = [
  {
    group: "Get started",
    href: "/developers",
    label: "Overview",
    description: "Terms of use, basics and best practices."
  },
  {
    group: "Get started",
    href: "/developers/quickstart",
    label: "Quickstart",
    description: "Make your first request in a minute, with curl or fetch."
  },
  {
    group: "Data",
    href: "/developers/api",
    label: "REST API",
    description:
      "One module as JSON, plus open data files for modules, class indexes and exams."
  },
  {
    group: "AI assistants",
    href: "/developers/mcp",
    label: "MCP server",
    description:
      "Add NTUMods to Claude, ChatGPT, Claude Code or Cursor. Tools, limits and errors."
  },
  {
    group: "AI assistants",
    href: "/developers/webmcp",
    label: "WebMCP",
    description:
      "Early preview: browser tools that let an assistant work on your own saved plans."
  }
] as const

/** The pages grouped for the side tree, keeping nav order. */
export const DEV_GROUPS = DEV_PAGES.reduce<
  { name: string; pages: (typeof DEV_PAGES)[number][] }[]
>((groups, page) => {
  const last = groups[groups.length - 1]
  if (last?.name === page.group) last.pages.push(page)
  else groups.push({ name: page.group, pages: [page] })
  return groups
}, [])

// The developer side nav. "Adding to" stands for the MCP client pages, which
// DevDocsLayout fills in from MCP_CLIENTS. Pages not in DEV_PAGES (data
// reference, freshness, status, MCP troubleshooting) are reached from here.
type NavLink = { href: string; label: string }
type NavItem = NavLink | { clients: true } | { subheading: string }

export const DEV_NAV: { title: string; items: NavItem[] }[] = [
  {
    title: "Get started",
    items: [
      { href: "/developers", label: "Overview" },
      { href: "/developers/quickstart", label: "Quickstart" }
    ]
  },
  {
    title: "MCP",
    items: [
      { href: "/developers/mcp", label: "What is MCP" },
      { clients: true },
      { subheading: "Reference" },
      { href: "/developers/mcp/tools", label: "MCP tools" },
      { href: "/developers/mcp/limits", label: "MCP limits and errors" },
      { href: "/developers/mcp/troubleshooting", label: "Troubleshooting" }
    ]
  },
  {
    title: "Build with the data",
    items: [
      { href: "/developers/api", label: "REST API" },
      { href: "/developers/data", label: "Data reference" },
      { href: "/developers/freshness", label: "Data freshness" },
      { href: "/developers/status", label: "Status and limits" },
      { href: "/developers/discovery", label: "AI discovery files" }
    ]
  },
  {
    title: "WebMCP",
    items: [
      { href: "/developers/webmcp", label: "What is WebMCP" },
      { href: "/developers/webmcp/examples", label: "What you can ask" },
      { href: "/developers/webmcp/try", label: "Try it" },
      { href: "/developers/webmcp/tools", label: "WebMCP tools" }
    ]
  }
]

/** Every plain link in the side nav, in order, for the phone page pills. */
export const DEV_LINKS = DEV_NAV.flatMap((section) => section.items).filter(
  (item): item is NavLink => "href" in item
)
