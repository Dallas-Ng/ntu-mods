import Link from "next/link"

import { siteConfig } from "@/config/site"

const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Timetable", href: "/timetable" },
      { label: "Mods", href: "/mods" },
      { label: "Articles", href: "/articles" }
    ]
  },
  {
    title: "Tools",
    links: [
      { label: "Wallpaper Maker", href: "/screenshot" },
      { label: "Settings", href: "/settings" }
    ]
  },
  {
    title: "Resources",
    links: [
      { label: "Sitemap", href: "/sitemap" },
      { label: "Changelog", href: "/changelog" },
      { label: "Report an Issue", href: "/settings#feedback" },
      { label: "Help", href: "/help" }
    ]
  },
  {
    title: "Project",
    links: [{ label: "Privacy", href: "/privacy" }]
  }
] as const

const Footer = () => {
  return (
    <footer className="border-border/60 mt-10 border-t">
      <div className="container grid gap-8 px-3 py-8 text-sm sm:grid-cols-2 lg:grid-cols-[1.2fr_repeat(4,1fr)] lg:px-5">
        <div className="space-y-2">
          <Link
            href="/"
            className="text-foreground inline-flex font-semibold transition-colors hover:text-blue-500">
            {siteConfig.name}
          </Link>

          <p className="text-muted-foreground max-w-xs leading-6">
            Plan NTU timetables, browse modules, compare indexes, and keep
            course planning links close at hand.
          </p>

          <p className="text-muted-foreground">
            NTUmods.com &copy; {new Date().getFullYear()}
          </p>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <nav key={group.title} aria-label={`${group.title} links`}>
            <h2 className="text-foreground text-sm font-semibold">
              {group.title}
            </h2>

            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-blue-500">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  )
}

export default Footer
