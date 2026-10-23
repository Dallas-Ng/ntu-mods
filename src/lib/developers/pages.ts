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
    label: "WebMCP and discovery",
    description:
      "Browser tools for your own plans, plus files for AI crawlers and agents."
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
