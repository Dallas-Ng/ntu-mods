import { siteConfig } from "@/config/site"
import { LATEST_SEMESTER_LABEL } from "@/lib/semesters"

const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Timetable", href: "/timetable" },
      { label: "Mods", href: "/mods" },
      { label: "Exams", href: "/exams" },
      { label: "Campus map", href: "/maps" },
      { label: "Articles", href: "/articles" }
    ]
  },
  {
    title: "Tools",
    links: [
      { label: "All tools", href: "/tools" },
      ...siteConfig.tools.map((t) => ({ label: t.name, href: t.href }))
    ]
  },
  {
    title: "Resources",
    links: [
      { label: "Links", href: "/links" },
      { label: "Changelog", href: "/changelog" },
      { label: "Feedback", href: "/feedback" },
      { label: "FAQ", href: "/faq" }
    ]
  },
  {
    title: "Developers",
    links: [
      { label: "Overview", href: "/developers" },
      { label: "MCP Server", href: "/developers/mcp" },
      { label: "REST API", href: "/developers/api" },
      { label: "WebMCP", href: "/developers/webmcp" },
      {
        label: "Contributing",
        href: `${siteConfig.links.repo}/blob/main/CONTRIBUTING.md`
      },
      { label: "GitHub", href: siteConfig.links.repo }
    ]
  }
]

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "AI instructions", href: "/ai-instructions" },
  { label: "Sitemap", href: "/sitemap" },
  { label: "Buy me a coffee", href: siteConfig.links.coffee },
  { label: "Sponsor", href: siteConfig.links.sponsor }
] as const

const Footer = () => {
  return (
    <footer className="border-border/60 bg-muted/30 mt-16 border-t px-3 lg:px-5">
      <div className="container grid gap-10 py-12 text-sm sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(4,1fr)]">
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <a
            href="/"
            className="text-foreground hover:text-primary inline-flex text-lg font-semibold tracking-tight transition-colors">
            {siteConfig.name}
          </a>

          <p className="text-muted-foreground max-w-xs leading-6">
            Plan NTU timetables, browse modules, compare indexes, and keep
            course planning links close at hand.
          </p>

          <a
            href="/faq#current-semester"
            className="bg-primary/10 ring-primary/20 text-primary hover:bg-primary/15 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors">
            <span className="bg-primary size-1.5 rounded-full" />
            {LATEST_SEMESTER_LABEL}
          </a>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <nav key={group.title} aria-label={`${group.title} links`}>
            <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {group.title}
            </h2>

            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    {...(link.href.startsWith("http") && {
                      target: "_blank",
                      rel: "noopener noreferrer"
                    })}
                    className="text-foreground hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-border/60 container flex flex-col gap-2 border-t pt-6 pb-24 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          &copy; {new Date().getFullYear()} NTUMods.com. Not affiliated with
          Nanyang Technological University.
        </p>
        <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2">
          {LEGAL_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                {...(link.href.startsWith("http") && {
                  target: "_blank",
                  rel: "noopener noreferrer"
                })}
                className="hover:text-primary transition-colors">
                {link.label}
              </a>
            </li>
          ))}
          <li id="cookie-settings" hidden>
            <button
              type="button"
              className="hover:text-primary cursor-pointer transition-colors">
              Cookie settings
            </button>
          </li>
        </ul>
      </div>
    </footer>
  )
}

export default Footer
