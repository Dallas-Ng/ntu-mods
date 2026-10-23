import { siteConfig } from "@/config/site"
import { getModuleTitles } from "@/lib/server/db/repo"
import { cn } from "@/lib/utils"
import { cardVariants } from "@/components/ui/card"
import Container from "@/components/container"
import Header, { SectionHeading } from "@/components/header"
import { getAllArticles } from "@/astro/lib/articles"

const CORE_LINKS = [
  {
    label: "Home",
    href: "/",
    description: "Overview of NTUMods: timetable, modules, exams, and guides"
  },
  {
    label: "Timetable",
    href: "/timetable",
    description:
      "Plan your NTU timetable, compare indexes, and export to calendar"
  },
  {
    label: "Mods",
    href: "/mods",
    description:
      "Browse all NTU modules, view class times, venues, and prerequisites"
  },
  {
    label: "Exams",
    href: "/exams",
    description:
      "Check NTU exam dates and times by module for the current semester"
  },
  {
    label: "Campus map",
    href: "/maps",
    description:
      "Find NTU lecture theatres, rooms and halls by level, with walking directions"
  },
  {
    label: "Tools",
    href: "/tools",
    description:
      "Free NTU student tools, including the CGPA Planner and FGO Optimiser"
  },
  {
    label: "Articles",
    href: "/articles",
    description: "Guides on choosing modules, BDEs, Common Core, and STARS prep"
  },
  {
    label: "Links",
    href: "/links",
    description:
      "Quick access to top NTU student portals: STARS, NTULearn, CareerAxis, and more"
  },
  {
    label: "FAQ",
    href: "/faq",
    description: "Quick answers about using NTUMods and how your data is stored"
  }
]

const TOOL_LINKS = [
  ...siteConfig.tools.map((t) => ({
    label: t.name,
    href: t.href,
    description: t.desc
  })),
  {
    label: "Changelog",
    href: "/changelog",
    description: "Recent updates and improvements to NTUMods"
  },
  {
    label: "Privacy",
    href: "/privacy",
    description: "How NTUMods handles your data and what stays on your device"
  },
  {
    label: "Terms",
    href: "/terms",
    description: "The terms for using NTUMods"
  },
  {
    label: "AI Instructions",
    href: "/ai-instructions",
    description: "Instructions for AI assistants to understand NTUMods"
  },
  {
    label: "Developers",
    href: "/developers",
    description:
      "Free public API and open data for NTU modules, indexes and exams"
  },
  {
    label: "Quickstart",
    href: "/developers/quickstart",
    description: "Make your first API request in a minute"
  },
  {
    label: "REST API and open data",
    href: "/developers/api",
    description: "The module API and whole-dataset JSON files, with OpenAPI"
  },
  {
    label: "MCP server",
    href: "/developers/mcp",
    description: "Add NTUMods to Claude, ChatGPT, Claude Code or Cursor"
  },
  {
    label: "Data reference",
    href: "/developers/data",
    description: "File layout, semester codes and what each field means"
  },
  {
    label: "Data freshness",
    href: "/developers/freshness",
    description: "Where the data comes from and how current it is"
  },
  {
    label: "Status and limits",
    href: "/developers/status",
    description: "Rate limits, status codes, caching and availability"
  },
  {
    label: "MCP troubleshooting",
    href: "/developers/mcp/troubleshooting",
    description: "Fixes for connection, missing tools and wrong answers"
  },
  {
    label: "MCP tools",
    href: "/developers/mcp/tools",
    description: "The six MCP tools, what each returns, and how to call one"
  },
  {
    label: "MCP limits and errors",
    href: "/developers/mcp/limits",
    description: "Caps, rate limit, status codes and tool errors"
  },
  {
    label: "WebMCP",
    href: "/developers/webmcp",
    description: "Early preview: browser tools for your own saved plans"
  },
  {
    label: "What you can ask through WebMCP",
    href: "/developers/webmcp/examples",
    description: "Example requests for a browser assistant"
  },
  {
    label: "Try WebMCP",
    href: "/developers/webmcp/try",
    description: "Turn on the Chrome flag and test the tools"
  },
  {
    label: "WebMCP tools",
    href: "/developers/webmcp/tools",
    description: "Every browser tool, grouped by what it does"
  },
  {
    label: "AI discovery files",
    href: "/developers/discovery",
    description:
      "llms.txt, ai-catalog.json and webmcp.json for crawlers and agents"
  },
  {
    label: "Feedback",
    href: "/feedback",
    description: "Share feedback, report a bug, or suggest an improvement"
  }
]

function getModulePrefix(code: string) {
  return code.match(/^[A-Z]+/)?.[0] ?? "#"
}

// Server-rendered at build time (this page is prerendered, and this component
// already reads articles off the filesystem), so it can fetch module titles
// here rather than bundling module-map.json into the client payload.
async function getModuleGroups() {
  const groups = new Map<string, Array<{ code: string; title: string }>>()

  for (const { code, title } of await getModuleTitles()) {
    const prefix = getModulePrefix(code)
    const modules = groups.get(prefix) ?? []
    modules.push({ code, title: title || code })
    groups.set(prefix, modules)
  }

  return Array.from(groups.entries()).map(([prefix, modules]) => ({
    prefix,
    modules
  }))
}

const SitemapContent = async () => {
  const articles = await getAllArticles()
  const moduleGroups = await getModuleGroups()

  return (
    <Container size="sm" className="space-y-10">
      <Header
        title="Sitemap"
        subtitle="Everything on NTUMods, organized in one place. Explore the tools, guides, and module pages below."
      />

      <section className="space-y-4">
        <SectionHeading>Core Pages</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          {CORE_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                cardVariants({ interactive: true }),
                "group rounded-2xl p-4"
              )}>
              <p className="text-foreground font-semibold">{link.label}</p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {link.description}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading>Tools and Support</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          {TOOL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                cardVariants({ interactive: true }),
                "group rounded-2xl p-4"
              )}>
              <p className="text-foreground font-semibold">{link.label}</p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {link.description}
              </p>
            </a>
          ))}
        </div>
      </section>

      {articles.length > 0 && (
        <section className="space-y-4">
          <SectionHeading>Articles</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {articles.map((article) => (
              <a
                key={article.slug}
                href={`/articles/${article.slug}`}
                className={cn(
                  cardVariants({ interactive: true }),
                  "group rounded-2xl p-4"
                )}>
                <p className="text-muted-foreground mb-1 text-xs">
                  {article.category}
                </p>
                <p className="text-foreground font-semibold">{article.title}</p>
                <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
                  {article.description}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <SectionHeading>Modules</SectionHeading>
          <p className="text-muted-foreground mt-1 text-sm">
            Module pages are grouped by course code prefix.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {moduleGroups.map((group) => (
            <a
              key={group.prefix}
              href={`#modules-${group.prefix.toLowerCase()}`}
              className="bg-muted text-foreground hover:bg-accent rounded-md px-2 py-1 text-sm transition-colors">
              {group.prefix}
            </a>
          ))}
        </div>

        <div className="space-y-8">
          {moduleGroups.map((group) => (
            <section
              id={`modules-${group.prefix.toLowerCase()}`}
              key={group.prefix}
              className="scroll-mt-20 border-t pt-6">
              <SectionHeading as="h3">{group.prefix}</SectionHeading>

              <div className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.modules.map((moduleItem) => (
                  <a
                    key={moduleItem.code}
                    href={`/mods/${moduleItem.code}`}
                    className="text-muted-foreground hover:text-foreground text-sm leading-6 transition-colors">
                    <span className="text-foreground font-medium">
                      {moduleItem.code}
                    </span>{" "}
                    {moduleItem.title}
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </Container>
  )
}

export default SitemapContent
